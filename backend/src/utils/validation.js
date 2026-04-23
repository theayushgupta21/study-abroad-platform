const Joi = require("joi");

const registerSchema = Joi.object({
  fullName: Joi.string().required().trim(),
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid("student", "counselor").default("student"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required(),
});

const profileUpdateSchema = Joi.object({
  targetCountries: Joi.array().items(Joi.string()),
  interestedFields: Joi.array().items(Joi.string()),
  preferredIntake: Joi.string(),
  maxBudgetUsd: Joi.number().min(0),
  englishTest: Joi.object({
    exam: Joi.string(),
    score: Joi.number().min(0).max(9),
  }),
});

const programQuerySchema = Joi.object({
  country: Joi.string(),
  field: Joi.string(),
  degreeLevel: Joi.string().valid("bachelor", "master", "diploma", "certificate"),
  minFee: Joi.number().min(0),
  maxFee: Joi.number().min(0),
  intake: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("tuitionFeeUsd", "qsRanking", "popularScore").default("popularScore"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

const { applicationStatuses } = require("../config/constants");

const createApplicationSchema = Joi.object({
  student: Joi.string().required(),
  program: Joi.string().required(),
  university: Joi.string().required(),
  destinationCountry: Joi.string().required(),
  intake: Joi.string().required(),
});

const updateApplicationStatusSchema = Joi.object({
  status: Joi.string().valid(...applicationStatuses).required(),
  note: Joi.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  programQuerySchema,
  createApplicationSchema,
  updateApplicationStatusSchema,
};
