const Redis = require("ioredis");
const NodeCache = require("node-cache");
const env = require("../config/env");

let redisClient = null;
const memoryCache = new NodeCache({ stdTTL: env.cacheTtlSeconds });

if (env.redisUrl) {
  redisClient = new Redis(env.redisUrl);
  redisClient.on("error", (err) => console.error("Redis Cache Error", err));
}

const getCache = async (key) => {
  if (redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn("Redis get failed, falling back to in-memory:", error);
    }
  }
  return memoryCache.get(key);
};

const setCache = async (key, value, ttl = env.cacheTtlSeconds) => {
  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), "EX", ttl);
      return;
    } catch (error) {
      console.warn("Redis set failed, falling back to in-memory:", error);
    }
  }
  memoryCache.set(key, value, ttl);
};

const cacheMiddleware = (req, res, next) => {
  // Only cache GET requests
  if (req.method !== "GET") {
    return next();
  }

  const cacheKey = req.originalUrl || req.url;

  getCache(cacheKey).then((cachedResponse) => {
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    const unpatchedJson = res.json.bind(res);
    res.json = (body) => {
      // Don't cache errors
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(cacheKey, body);
      }
      return unpatchedJson(body);
    };

    next();
  });
};

module.exports = {
  cacheMiddleware,
  getCache,
  setCache,
};
