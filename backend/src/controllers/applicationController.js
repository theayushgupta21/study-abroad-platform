const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const listApplications = asyncHandler(async (req, res) => {
  const { studentId, status } = req.query;
  const filters = {};

  // For students, default to their own applications
  if (req.user.role === 'student') {
    filters.student = req.user._id;
  } else if (studentId) {
    filters.student = studentId;
  }

  if (status) {
    filters.status = status;
  }

  const applications = await Application.find(filters)
    .populate("student", "fullName email role")
    .populate("program", "title degreeLevel tuitionFeeUsd")
    .populate("university", "name country city")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: applications,
  });
});

const { createApplicationSchema, updateApplicationStatusSchema } = require("../utils/validation");
const { validStatusTransitions } = require("../config/constants");

const createApplication = asyncHandler(async (req, res) => {
  const { error } = createApplicationSchema.validate(req.body);
  if (error) {
    throw new HttpError(400, error.details[0].message);
  }

  const { student, program, university, destinationCountry, intake } = req.body;

  // Prevent duplicate applications
  const existingApplication = await Application.findOne({ student, program, intake });
  if (existingApplication) {
    throw new HttpError(400, "Application for this program and intake already exists.");
  }

  const application = await Application.create({
    student,
    program,
    university,
    destinationCountry,
    intake,
    status: "draft",
    timeline: [{ status: "draft", note: "Application created." }],
  });

  res.status(201).json({
    success: true,
    data: application,
  });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error } = updateApplicationStatusSchema.validate(req.body);
  if (error) {
    throw new HttpError(400, error.details[0].message);
  }

  const { status: newStatus, note } = req.body;

  const application = await Application.findById(id);
  if (!application) {
    throw new HttpError(404, "Application not found");
  }

  const currentStatus = application.status;
  const allowedTransitions = validStatusTransitions[currentStatus];

  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new HttpError(400, `Invalid status transition from ${currentStatus} to ${newStatus}`);
  }

  application.status = newStatus;
  application.timeline.push({
    status: newStatus,
    note: note || `Status updated to ${newStatus}`,
    changedAt: new Date(),
  });

  await application.save();

  res.json({
    success: true,
    data: application,
  });
});

module.exports = {
  createApplication,
  listApplications,
  updateApplicationStatus,
};
