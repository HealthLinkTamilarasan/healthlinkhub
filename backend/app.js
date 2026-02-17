import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware


const allowedOrigins = [
  "http://localhost:5173",
  "https://healthlinkhub.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// 🔥 VERY IMPORTANT: handle preflight manually
app.options("*", cors());


app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Static uploads
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check (SAFE)
app.get('/', (req, res) => {
  res.send('HealthLinkHub API running...');
});

// Error handler ONLY (no wildcard routes)
app.use((err, req, res, next) => {
  const statusCode = res.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

export default app;
