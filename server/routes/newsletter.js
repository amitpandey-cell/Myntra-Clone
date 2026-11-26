import { Router } from "express";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";
import { requireDatabase } from "../config/database.js";

const router = Router();
router.use(requireDatabase);

router.post("/", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    await NewsletterSubscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    res.status(201).json({ message: "You’re on the list. Look out for a note from StyleKart." });
  } catch (error) {
    next(error);
  }
});

export default router;
