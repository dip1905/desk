const express          = require("express");
const router           = express.Router();
const { protect }      = require("../../middleware/auth.middleware");
const { authorizeRoles } = require("../../middleware/role.middleware");
const {
  getChannels,
  createChannel,
  getChannelMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getDMMessages,
  sendDM,
} = require("./chat.controller");

router.use(protect);

// Channels
// GET  /api/chat/channels
// POST /api/chat/channels
router.get("/channels",
  getChannels
);
router.post("/channels",
  authorizeRoles("SUPER_ADMIN","ADMIN","MANAGER"),
  createChannel
);

// Channel messages
// GET  /api/chat/channels/:id/messages
// POST /api/chat/channels/:id/messages
router.get("/channels/:id/messages",
  getChannelMessages
);
router.post("/channels/:id/messages",
  sendMessage
);

// Message edit and delete
// PUT    /api/chat/messages/:id
// DELETE /api/chat/messages/:id
router.put("/messages/:id",
  editMessage
);
router.delete("/messages/:id",
  deleteMessage
);

// Direct messages
// GET  /api/chat/dm/:userId/messages
// POST /api/chat/dm/:userId/messages
router.get("/dm/:userId/messages",
  getDMMessages
);
router.post("/dm/:userId/messages",
  sendDM
);

module.exports = router;