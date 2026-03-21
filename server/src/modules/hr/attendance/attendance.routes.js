const express  = require("express");
const router   = express.Router();
const { protect }        = require("../../../middleware/auth.middleware");
const { authorizeRoles } = require("../../../middleware/role.middleware");
const {
  checkIn,
  checkOut,
  getAttendance,
  manualAttendance,
} = require("./attendance.controller");

router.use(protect);

// Check in for today
router.post("/checkin",  checkIn);

// Check out for today
router.post("/checkout", checkOut);

// Get attendance log
router.get("/",          getAttendance);

// Manual attendance — Manager/Admin only
router.post("/manual",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "MANAGER"),
  manualAttendance
);

module.exports = router;