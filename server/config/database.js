import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI is not configured. API data and account features will be unavailable.");
    return false;
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");
  return true;
}

export function requireDatabase(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database unavailable. Configure MONGODB_URI and restart the API." });
  }
  next();
}
