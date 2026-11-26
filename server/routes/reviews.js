import { Router } from "express";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import { authenticate } from "../middleware/auth.js";
import { requireDatabase } from "../config/database.js";

const router = Router();
router.use(requireDatabase);

router.get("/:productId", async (req, res, next) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

router.post("/:productId", authenticate, async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !title || !body) {
      return res.status(400).json({ message: "Add a title, review, and rating from 1 to 5." });
    }
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) return res.status(404).json({ message: "Product not found." });
    const review = await Review.create({
      productId: product.productId,
      user: req.user.id,
      userName: req.user.name,
      rating,
      title,
      body,
    });
    const aggregate = await Review.aggregate([
      { $match: { productId: product.productId } },
      { $group: { _id: "$productId", rating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (aggregate[0]) {
      product.rating = Math.round(aggregate[0].rating * 10) / 10;
      product.reviewCount = aggregate[0].count;
      await product.save();
    }
    res.status(201).json({ review });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "You have already reviewed this product." });
    next(error);
  }
});

export default router;
