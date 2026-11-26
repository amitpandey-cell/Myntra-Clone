import { randomBytes, createHash } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { requireDatabase } from "../config/database.js";

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  addresses: user.addresses,
});

function sessionCookie(res, userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw Object.assign(new Error("Configure a JWT_SECRET of at least 32 characters."), { status: 503 });
  }
  const token = jwt.sign({ sub: userId }, secret, { expiresIn: "7d" });
  res.cookie("stylekart_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function requireJwtSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw Object.assign(new Error("Configure a JWT_SECRET of at least 32 characters."), { status: 503 });
  }
}

router.use(requireDatabase);

router.post("/signup", async (req, res, next) => {
  try {
    requireJwtSecret();
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2 || name.length > 100 || !emailPattern.test(email) || password.length < 10 || password.length > 128) {
      return res.status(400).json({ message: "Enter a valid name and email, and a password between 10 and 128 characters." });
    }
    if (await User.exists({ email })) return res.status(409).json({ message: "An account with this email already exists." });

    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    sessionCookie(res, user.id);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    requireJwtSecret();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }
    sessionCookie(res, user.id);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("stylekart_session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.json({ message: "Signed out." });
});

router.get("/me", authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

router.put("/profile", authenticate, async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (name.length < 2 || name.length > 100) return res.status(400).json({ message: "Name must be between 2 and 100 characters." });
    req.user.name = name;
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
});

router.put("/addresses", authenticate, async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.addresses) || req.body.addresses.length > 10) {
      return res.status(400).json({ message: "Provide up to 10 saved addresses." });
    }
    req.user.addresses = req.body.addresses;
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
      return res.status(503).json({ message: "Password reset email is not configured. Contact the store administrator." });
    }
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!emailPattern.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
    const user = await User.findOne({ email });
    if (user) {
      const token = randomBytes(32).toString("hex");
      user.resetTokenHash = createHash("sha256").update(token).digest("hex");
      user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      });
      const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${encodeURIComponent(token)}`;
      await transport.sendMail({
        from: SMTP_FROM,
        to: user.email,
        subject: "Reset your StyleKart password",
        text: `Use this link within 30 minutes to reset your password: ${link}`,
      });
    }
    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    if (password.length < 10 || password.length > 128) {
      return res.status(400).json({ message: "Password must be between 10 and 128 characters." });
    }
    const resetTokenHash = createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ resetTokenHash, resetTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "This password reset link is invalid or has expired." });
    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ message: "Password updated. You can now sign in." });
  } catch (error) {
    next(error);
  }
});

export default router;
