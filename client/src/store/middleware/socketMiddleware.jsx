import { io } from "socket.io-client";
import {
  addMessage,
  updateMessage,
  deleteMessage,
  setUserOnline,
  setUserOffline,
  setTypingUsers,
} from "../slices/chatSlice";
import { addNotification } from "../slices/notificationSlice";

let socket = null;

const socketMiddleware = (store) => (next) => (action) => {

  // Connect when user logs in
  if (action.type === "auth/setCredentials") {
    const token = action.payload.token;

    socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth:       { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
    });

    socket.on("message:new",
      (msg)    => store.dispatch(addMessage(msg)));
    socket.on("message:updated",
      (data)   => store.dispatch(updateMessage(data)));
    socket.on("message:deleted",
      (data)   => store.dispatch(deleteMessage(data)));
    socket.on("user:online",
      (userId) => store.dispatch(setUserOnline(userId)));
    socket.on("user:offline",
      (userId) => store.dispatch(setUserOffline(userId)));
    socket.on("typing:update",
      (data)   => store.dispatch(setTypingUsers(data)));
    socket.on("notification:new",
      (notif)  => store.dispatch(addNotification(notif)));

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    socket.on("connect_error", (err) => {
      console.log("Socket error:", err.message);
    });
  }

  // Disconnect on logout
  if (action.type === "auth/logout") {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  // Emit socket events from components
  if (action.type === "socket/emit") {
    if (socket) {
      socket.emit(action.payload.event, action.payload.data);
    }
  }

  return next(action);
};

export const emitSocketEvent = (event, data) => ({
  type:    "socket/emit",
  payload: { event, data },
});

export default socketMiddleware;