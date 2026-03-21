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
  });

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

  io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.user.name}`);

    socket.join(socket.user.id);
    socket.broadcast.emit("user:online", socket.user.id);

    socket.on("channel:join",  (channelId) => socket.join(channelId));
    socket.on("channel:leave", (channelId) => socket.leave(channelId));

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

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initSocket, getIO };