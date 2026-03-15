const express = require("express");
const router  = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword,
} = require("./auth.controller");

// ─── PUBLIC ROUTES ────────────────────────────────────
// No token needed for these
router.post("/register", register);
router.post("/login",    login);

// ─── PROTECTED ROUTES ─────────────────────────────────
// Token required — protect middleware runs first
router.get("/me",                protect, getMe);
router.post("/logout",           protect, logout);
router.put("/profile",           protect, updateProfile);
router.put("/change-password",   protect, changePassword);

module.exports = router;