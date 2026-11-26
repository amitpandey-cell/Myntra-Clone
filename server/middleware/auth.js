import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authenticate(req, res, next) {
  const token = req.cookies?.stylekart_session;
  if (!token) return res.status(401).json({ message: "Please sign in to continue." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("name email role addresses");
    if (!user) return res.status(401).json({ message: "Your session is no longer valid. Sign in again." });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Your session has expired. Sign in again." });
    }
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Administrator access is required." });
  }
  next();
}
