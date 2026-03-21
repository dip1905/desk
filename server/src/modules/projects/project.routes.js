const express            = require("express");
const router             = express.Router();
const { protect }        = require("../../middleware/auth.middleware");
const { authorizeRoles } = require("../../middleware/role.middleware");
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require("./project.controller");

router.use(protect);

router.get("/",                    getAllProjects);
router.post("/",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "MANAGER"),
  createProject
);
router.get("/:id",                 getProjectById);
router.put("/:id",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "MANAGER"),
  updateProject
);
router.delete("/:id",
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  deleteProject
);
router.post("/:id/members",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "MANAGER"),
  addMember
);
router.delete("/:id/members/:userId",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "MANAGER"),
  removeMember
);

module.exports = router;