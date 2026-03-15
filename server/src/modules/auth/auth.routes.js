const express  = require("express");
const router   = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const {
  checkSetup,
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword,
} = require("./auth.controller");

// ─── PUBLIC ROUTES ────────────────────────────────────
router.get("/check-setup", checkSetup);
router.post("/register",   register);
router.post("/login",      login);

// ─── PROTECTED ROUTES ─────────────────────────────────
router.get("/me",                protect, getMe);
router.post("/logout",           protect, logout);
router.put("/profile",           protect, updateProfile);
router.put("/change-password",   protect, changePassword);

module.exports = router;