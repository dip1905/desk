const express     = require("express");
const router      = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("./notification.controller");

router.use(protect);

router.get("/",              getNotifications);
router.patch("/:id/read",    markAsRead);
router.patch("/read-all",    markAllAsRead);

module.exports = router;