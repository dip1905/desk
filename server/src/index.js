const express          = require("express");
const http             = require("http");
const cors             = require("cors");
const morgan           = require("morgan");
const dotenv           = require("dotenv");
const cookieParser     = require("cookie-parser");
const errorMiddleware  = require("./middleware/error.middleware");
const { initSocket }   = require("./socket/socket");

dotenv.config();
require("./config/db");

const authRoutes         = require("./modules/auth/auth.routes");
const employeeRoutes     = require("./modules/hr/employee/employee.routes");
const leaveRoutes        = require("./modules/hr/leave/leave.routes");
const attendanceRoutes   = require("./modules/hr/attendance/attendance.routes");
const projectRoutes      = require("./modules/projects/project.routes");
const taskRoutes         = require("./modules/tasks/task.routes");
const chatRoutes         = require("./modules/chat/chat.routes");
const notificationRoutes = require("./modules/notifications/notification.routes");
const fileRoutes         = require("./modules/files/file.routes");
const analyticsRoutes    = require("./modules/analytics/analytics.routes");

const app    = express();
const server = http.createServer(app);

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:3000",
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// ─── ROUTES ───────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/employees",     employeeRoutes);
app.use("/api/leaves",        leaveRoutes);
app.use("/api/attendance",    attendanceRoutes);
app.use("/api/projects",      projectRoutes);
app.use("/api/tasks",         taskRoutes);
app.use("/api/chat",          chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/files",         fileRoutes);
app.use("/api/analytics",     analyticsRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success:     true,
    message:     "Desk API is running",
    environment: process.env.NODE_ENV,
  });
});

app.use(errorMiddleware);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Desk server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
});

module.exports = { app, server };