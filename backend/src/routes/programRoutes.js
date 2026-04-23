const express = require("express");
const { listPrograms, getProgramById, comparePrograms } = require("../controllers/programController");
const { cacheMiddleware } = require("../middleware/cache");

const router = express.Router();

router.get("/", cacheMiddleware, listPrograms);
router.get("/compare", comparePrograms);
router.get("/:id", getProgramById);

module.exports = router;
