const express         = require("express");
const http            = require("http");
const cors            = require("cors");
const morgan          = require("morgan");
const dotenv          = require("dotenv");
const cookieParser    = require("cookie-parser");

dotenv.config();
require("./config/db");

const errorMiddleware = require("./middleware/error.middleware");

// Import routes
const authRoutes = require("./modules/auth/auth.routes");

const app    = express();
const server = http.createServer(app);

app.use(cors({
  origin:      process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// ─── ROUTES ───────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success:     true,
    message:     "Desk API is running",
    environment: process.env.NODE_ENV,
  });
});

// Global error handler — always last
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Desk server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
});

module.exports = { app, server };