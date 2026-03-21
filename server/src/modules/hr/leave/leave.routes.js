const express  = require("express");
const router   = express.Router();
const { protect }        = require("../../../middleware/auth.middleware");
const { authorizeRoles } = require("../../../middleware/role.middleware");
const {
  applyLeave,
  getAllLeaves,
  updateLeaveStatus,
  cancelLeave,
} = require("./leave.controller");

router.use(protect);

// Apply for leave — any employee
router.post("/",          applyLeave);

// Get all leaves
// Employee sees own leaves
// Manager/Admin sees all
router.get("/",           getAllLeaves);

// Approve or reject — Manager/Admin only
router.patch("/:id/status",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "MANAGER"),
  updateLeaveStatus
);

// Cancel own pending leave
router.delete("/:id",     cancelLeave);

module.exports = router;