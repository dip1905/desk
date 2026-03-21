const prisma    = require("../../config/db");
const { getIO } = require("../../socket/socket");

const getChannels = async (req, res, next) => {
  try {
    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          { isPrivate: false },
          {
            isPrivate: true,
            members: { some: { userId: req.user.id } }
          }
        ]
      },
      include: {
        _count: { select: { messages: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    res.status(200).json({ success: true, data: channels });
  } catch (error) { next(error); }
};

const createChannel = async (req, res, next) => {
  try {
    const { name, isPrivate, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Channel name is required",
      });
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        isPrivate: isPrivate || false,
        members: {
          create: [
            { userId: req.user.id },
            ...(memberIds || [])
              .filter((id) => id !== req.user.id)
              .map((userId) => ({ userId })),
          ]
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Channel created",
      data:    channel,
    });
  } catch (error) { next(error); }
};

const getChannelMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const messages = await prisma.message.findMany({
      where: { channelId: req.params.id },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip:    (Number(page) - 1) * Number(limit),
      take:    Number(limit),
    });

    res.status(200).json({
      success: true,
      data:    messages.reverse(),
    });
  } catch (error) { next(error); }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content, fileUrl } = req.body;

    if (!content && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Message content or file is required",
      });
    }

    const message = await prisma.message.create({
      data: {
        content:   content || null,
        channelId: req.params.id,
        senderId:  req.user.id,
        fileUrl:   fileUrl || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Emit to all users in channel
    try {
      const io = getIO();
      io.to(req.params.id).emit("message:new", message);
    } catch { /* socket not ready */ }

    res.status(201).json({ success: true, data: message });
  } catch (error) { next(error); }
};

const editMessage = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const message = await prisma.message.findUnique({
      where: { id: req.params.id }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only sender can edit
    if (message.senderId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages",
      });
    }

    // 24 hour edit window
    const hoursSince = (Date.now() - new Date(message.createdAt)) /
      (1000 * 60 * 60);

    if (hoursSince > 24) {
      return res.status(400).json({
        success: false,
        message: "Messages can only be edited within 24 hours",
      });
    }

    const editedAt = new Date();
    const updated  = await prisma.message.update({
      where: { id: req.params.id },
      data:  { content, isEdited: true, editedAt },
    });

    // Emit to channel
    try {
      const io = getIO();
      const room = message.channelId || message.receiverId;
      io.to(room).emit("message:updated", {
        messageId: req.params.id,
        content,
        editedAt,
      });
    } catch { /* socket not ready */ }

    res.status(200).json({
      success: true,
      message: "Message edited",
      data:    updated,
    });
  } catch (error) { next(error); }
};

const deleteMessage = async (req, res, next) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(req.user.role);

    // Only sender or admin can delete
    if (message.senderId !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    const deletedAt = new Date();

    // Soft delete — content cleared, record kept
    await prisma.message.update({
      where: { id: req.params.id },
      data: {
        content:   null,
        isDeleted: true,
        deletedAt,
      }
    });

    // Emit to channel
    try {
      const io   = getIO();
      const room = message.channelId || message.receiverId;
      io.to(room).emit("message:deleted", {
        messageId: req.params.id
      });
    } catch { /* socket not ready */ }

    res.status(200).json({
      success: true,
      message: "Message deleted",
    });
  } catch (error) { next(error); }
};

const getDMMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId:   req.user.id,
            receiverId: req.params.userId,
          },
          {
            senderId:   req.params.userId,
            receiverId: req.user.id,
          }
        ]
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip:    (Number(page) - 1) * Number(limit),
      take:    Number(limit),
    });

    res.status(200).json({
      success: true,
      data:    messages.reverse(),
    });
  } catch (error) { next(error); }
};

const sendDM = async (req, res, next) => {
  try {
    const { content, fileUrl } = req.body;

    if (!content && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Content or file is required",
      });
    }

    const message = await prisma.message.create({
      data: {
        content:    content || null,
        senderId:   req.user.id,
        receiverId: req.params.userId,
        fileUrl:    fileUrl || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Emit to recipient's personal room
    try {
      const io = getIO();
      io.to(req.params.userId).emit("message:new", message);
    } catch { /* socket not ready */ }

    res.status(201).json({ success: true, data: message });
  } catch (error) { next(error); }
};

module.exports = {
  getChannels,
  createChannel,
  getChannelMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getDMMessages,
  sendDM,
};