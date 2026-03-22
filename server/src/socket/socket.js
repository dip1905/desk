const { Server } = require("socket.io");
const jwt        = require("jsonwebtoken");
const prisma     = require("../config/db");

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin:      process.env.CLIENT_URL,
      credentials: true,
    },
    transports:    ["polling", "websocket"],
    pingTimeout:   60000,
    pingInterval:  25000,
  });

  // ─── AUTH MIDDLEWARE ──────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await prisma.user.findUnique({
        where:  { id: decoded.id },
        select: { id: true, name: true, role: true },
      });

      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // ─── CONNECTION ───────────────────────────────────
  io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.user.name}`);

    // Join personal room for direct notifications
    socket.join(socket.user.id);

    // Broadcast online status to everyone
    socket.broadcast.emit("user:online", socket.user.id);

    // ─── CHANNEL EVENTS ───────────────────────────
    socket.on("channel:join", (channelId) => {
      socket.join(channelId);
    });

    socket.on("channel:leave", (channelId) => {
      socket.leave(channelId);
    });

    // ─── MESSAGE SEND ─────────────────────────────
    socket.on("message:send", async ({ channelId, content, fileUrl }) => {
      try {
        if (!content && !fileUrl) return;

        const message = await prisma.message.create({
          data: {
            content:   content  || null,
            fileUrl:   fileUrl  || null,
            channelId: channelId || null,
            senderId:  socket.user.id,
          },
          include: {
            sender: {
              select: {
                id:     true,
                name:   true,
                avatar: true,
              }
            }
          }
        });

        // Send to all users in channel including sender
        io.to(channelId).emit("message:new", message);

      } catch (error) {
        console.error("Message send error:", error.message);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ─── DM SEND ──────────────────────────────────
    socket.on("dm:send", async ({ receiverId, content, fileUrl }) => {
      try {
        if (!content && !fileUrl) return;

        const message = await prisma.message.create({
          data: {
            content:    content    || null,
            fileUrl:    fileUrl    || null,
            senderId:   socket.user.id,
            receiverId: receiverId || null,
          },
          include: {
            sender: {
              select: {
                id:     true,
                name:   true,
                avatar: true,
              }
            }
          }
        });

        // Send to receiver's personal room
        io.to(receiverId).emit("message:new", {
          ...message,
          isDM: true,
        });

        // Also send back to sender
        socket.emit("message:new", {
          ...message,
          isDM: true,
        });

      } catch (error) {
        console.error("DM send error:", error.message);
        socket.emit("error", { message: "Failed to send DM" });
      }
    });

    // ─── MESSAGE EDIT ─────────────────────────────
    socket.on("message:edit", async ({ messageId, content }) => {
      try {
        const message = await prisma.message.findUnique({
          where: { id: messageId }
        });

        if (!message) return;

        // Only sender can edit
        if (message.senderId !== socket.user.id) {
          socket.emit("error", {
            message: "You can only edit your own messages"
          });
          return;
        }

        // 24 hour edit window
        const hoursSinceSent = (
          (new Date() - new Date(message.createdAt))
          / (1000 * 60 * 60)
        );

        if (hoursSinceSent > 24) {
          socket.emit("error", {
            message: "Messages can only be edited within 24 hours"
          });
          return;
        }

        const updated = await prisma.message.update({
          where: { id: messageId },
          data: {
            content,
            isEdited: true,
            editedAt: new Date(),
          }
        });

        // Broadcast to channel or DM room
        const roomId = message.channelId || message.receiverId;
        if (roomId) {
          io.to(roomId).emit("message:updated", {
            messageId,
            content,
            editedAt: updated.editedAt,
          });
        }

      } catch (error) {
        console.error("Message edit error:", error.message);
        socket.emit("error", { message: "Failed to edit message" });
      }
    });

    // ─── MESSAGE DELETE ───────────────────────────
    socket.on("message:delete", async ({ messageId }) => {
      try {
        const message = await prisma.message.findUnique({
          where: { id: messageId }
        });

        if (!message) return;

        // Only sender or admin can delete
        const isAdmin = ["SUPER_ADMIN", "ADMIN"]
          .includes(socket.user.role);

        if (message.senderId !== socket.user.id && !isAdmin) {
          socket.emit("error", {
            message: "You can only delete your own messages"
          });
          return;
        }

        // Soft delete
        await prisma.message.update({
          where: { id: messageId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            content:   null,
          }
        });

        // Broadcast to channel or DM room
        const roomId = message.channelId || message.receiverId;
        if (roomId) {
          io.to(roomId).emit("message:deleted", { messageId });
        }

      } catch (error) {
        console.error("Message delete error:", error.message);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    // ─── TYPING EVENTS ────────────────────────────
    socket.on("typing:start", ({ channelId }) => {
      socket.to(channelId).emit("typing:update", {
        channelId,
        userId:   socket.user.id,
        name:     socket.user.name,
        isTyping: true,
      });
    });

    socket.on("typing:stop", ({ channelId }) => {
      socket.to(channelId).emit("typing:update", {
        channelId,
        userId:   socket.user.id,
        name:     socket.user.name,
        isTyping: false,
      });
    });

    // ─── NOTIFICATION EMIT ────────────────────────
    // Helper to send notification to specific user
    socket.on("notification:send", async ({ userId, title, message, type }) => {
      try {
        const notification = await prisma.notification.create({
          data: { userId, title, message, type }
        });

        // Send to user's personal room
        io.to(userId).emit("notification:new", notification);

      } catch (error) {
        console.error("Notification error:", error.message);
      }
    });

    // ─── DISCONNECT ───────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔴 Disconnected: ${socket.user.name}`);

      prisma.user.update({
        where: { id: socket.user.id },
        data:  { lastSeen: new Date() },
      }).catch(console.error);

      socket.broadcast.emit("user:offline", socket.user.id);
    });
  });

  console.log("⚡ Socket.io initialized");
  return io;
};

// Export io so controllers can emit notifications
const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initSocket, getIO };