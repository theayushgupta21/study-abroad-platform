const Program = require("../models/Program");
const asyncHandler = require("../utils/asyncHandler");
const QueryBuilder = require("../utils/queryBuilder");

const listPrograms = asyncHandler(async (req, res) => {
  const queryBuilder = new QueryBuilder(Program, req.query)
    .filter()
    .sort()
    .paginate();

  const { items, meta } = await queryBuilder.execute();

  res.json({
    success: true,
    data: items,
    meta,
  });
});

const getProgramById = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id).populate("university");
  if (!program) {
    throw new HttpError(404, "Program not found");
  }
  res.json({ success: true, data: program });
});

const comparePrograms = asyncHandler(async (req, res) => {
  const { ids } = req.query; // Expecting comma separated IDs
  if (!ids) {
    throw new HttpError(400, "Program IDs are required for comparison");
  }

  const programIds = ids.split(",");
  const programs = await Program.find({ _id: { $in: programIds } }).populate("university");

  res.json({
    success: true,
    data: programs,
  });
});

module.exports = {
  listPrograms,
  getProgramById,
  comparePrograms,
};
