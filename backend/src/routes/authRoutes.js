const express = require("express");

const { login, me, register, refresh, toggleSaveProgram } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", requireAuth, me);
router.post("/toggle-save", requireAuth, toggleSaveProgram);

module.exports = router;
