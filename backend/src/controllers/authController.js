const jwt = require("jsonwebtoken");
const env = require("../config/env");
const Student = require("../models/Student");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { registerSchema, loginSchema } = require("../utils/validation");

const generateTokens = (id) => {
  const accessToken = jwt.sign({ sub: id }, env.jwtSecret, {
    expiresIn: "15m", // Short-lived access token
  });
  const refreshToken = jwt.sign({ sub: id }, env.jwtSecret, {
    expiresIn: "7d", // Long-lived refresh token
  });
  return { accessToken, refreshToken };
};

const register = asyncHandler(async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    throw new HttpError(400, error.details[0].message);
  }

  const { fullName, email, password, role } = req.body;

  const userExists = await Student.findOne({ email });
  if (userExists) {
    throw new HttpError(400, "User already exists");
  }

  const { accessToken, refreshToken } = generateTokens("placeholder_id"); // Temporary to get the structure

  const user = await Student.create({
    fullName,
    email,
    password,
    role,
    refreshToken,
  });

  const tokens = generateTokens(user._id);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      ...tokens,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    throw new HttpError(400, error.details[0].message);
  }

  const { email, password } = req.body;

  const user = await Student.findOne({ email });

  if (user && (await user.comparePassword(password))) {
    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        ...tokens,
      },
    });
  } else {
    throw new HttpError(401, "Invalid email or password");
  }
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new HttpError(400, "Refresh token required");
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtSecret);
    const user = await Student.findOne({ _id: decoded.sub, refreshToken });

    if (!user) {
      throw new HttpError(401, "Invalid refresh token");
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      success: true,
      data: tokens,
    });
  } catch (err) {
    throw new HttpError(401, "Invalid or expired refresh token");
  }
});

const me = asyncHandler(async (req, res) => {
  const user = await Student.findById(req.user._id).select("-password").populate("savedPrograms");
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  res.json({
    success: true,
    data: user,
  });
});

const toggleSaveProgram = asyncHandler(async (req, res) => {
  const { programId } = req.body;
  if (!programId) {
    throw new HttpError(400, "Program ID is required");
  }

  const user = await Student.findById(req.user._id);
  const index = user.savedPrograms.indexOf(programId);

  if (index === -1) {
    user.savedPrograms.push(programId);
  } else {
    user.savedPrograms.splice(index, 1);
  }

  await user.save();
  res.json({
    success: true,
    message: index === -1 ? "Program saved" : "Program removed",
    data: user.savedPrograms,
  });
});

module.exports = {
  register,
  login,
  me,
  refresh,
  toggleSaveProgram,
};

