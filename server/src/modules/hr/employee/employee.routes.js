const express  = require("express");
const router   = express.Router();
const { protect }        = require("../../../middleware/auth.middleware");
const { authorizeRoles } = require("../../../middleware/role.middleware");
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("./employee.controller");

// All routes require login
router.use(protect);

// GET all employees — Admin, Manager can see all
router.get("/",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "MANAGER"),
  getAllEmployees
);

// GET single employee
router.get("/:id",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "MANAGER"),
  getEmployeeById
);

// POST create employee — Admin only
router.post("/",
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  createEmployee
);

// PUT update employee — Admin only
router.put("/:id",
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  updateEmployee
);

// DELETE deactivate employee — Admin only
router.delete("/:id",
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  deleteEmployee
);

module.exports = router;