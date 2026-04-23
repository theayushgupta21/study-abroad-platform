const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const Student = require("../src/models/Student");

describe("Auth API", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/waygood-test-db", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Student.deleteMany({});
  });

  const testUser = {
    fullName: "John Doe",
    email: "john@example.com",
    password: "password123",
  };

  it("should register a new user successfully", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data).toHaveProperty("refreshToken");
  });

  it("should not register a user with an existing email", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("User already exists");
  });

  it("should login successfully with correct credentials", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data).toHaveProperty("refreshToken");
  });

  it("should fail login with incorrect password", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });
});
