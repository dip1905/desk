const express            = require("express");
const router             = express.Router();
const { protect }        = require("../../middleware/auth.middleware");
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
  getActivityLog,
} = require("./task.controller");

router.use(protect);

router.get("/",              getAllTasks);
router.post("/",             createTask);
router.get("/:id",           getTaskById);
router.put("/:id",           updateTask);
router.delete("/:id",        deleteTask);
router.patch("/:id/status",  updateTaskStatus);
router.post("/:id/comments", addComment);
router.get("/:id/activity",  getActivityLog);

module.exports = router;