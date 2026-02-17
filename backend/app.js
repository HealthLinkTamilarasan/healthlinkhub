import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// ✅ CORS CONFIGURATION
// ===============================

const allowedOrigins = [
  "http://localhost:5173",
  "https://healthlinkhub.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman / server-to-server
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ===============================
// ✅ MIDDLEWARE
// ===============================

app.use(express.json());

// ===============================
// ✅ ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ===============================
// ✅ STATIC UPLOADS
// ===============================

const uploadPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

app.use("/uploads", express.static(uploadPath));

// ===============================
// ✅ HEALTH CHECK ROUTE
// ===============================

app.get("/", (req, res) => {
  res.send("HealthLinkHub API running...");
});

// ===============================
// ✅ GLOBAL ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  res.status(500).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

export default app;
