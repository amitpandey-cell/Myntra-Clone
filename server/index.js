import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import reviewRoutes from "./routes/reviews.js";
import adminRoutes from "./routes/admin.js";
import newsletterRoutes from "./routes/newsletter.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1,
    paymentsConfigured: Boolean(process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") && process.env.RAZORPAY_KEY_SECRET),
  });
});

app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false }), authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/newsletter", rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false }), newsletterRoutes);

app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found." }));
app.use((error, req, res, next) => {
  console.error(`API request failed (${req.method} ${req.originalUrl}):`, error);
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) ? error.status : error.name === "ValidationError" ? 400 : 500;
  const message = status === 500 ? "An unexpected server error occurred." : error.message;
  res.status(status).json({ message });
});

async function start() {
  try {
    await connectDatabase();
  } catch {
    console.error("MongoDB connection failed. Check your connection settings.");
  }
  app.listen(port, () => {
    console.log(`StyleKart API listening on http://localhost:${port}`);
  });
}

start();
