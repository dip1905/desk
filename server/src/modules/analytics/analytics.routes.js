const express            = require("express");
const router             = express.Router();
const { protect }        = require("../../middleware/auth.middleware");
const { authorizeRoles } = require("../../middleware/role.middleware");
const {
  getOverview,
  getTaskStats,
  getAttendanceStats,
  getMySummary,
} = require("./analytics.controller");

router.use(protect);

router.get("/overview",    
  authorizeRoles("SUPER_ADMIN", "ADMIN", "MANAGER"),
  getOverview
);
router.get("/tasks",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "MANAGER"),
  getTaskStats
);
router.get("/attendance",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "MANAGER"),
  getAttendanceStats
);
router.get("/my-summary",  getMySummary);

module.exports = router;