import { Router } from "express";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import { requireDatabase } from "../config/database.js";

const router = Router();
router.use(requireDatabase);

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 80);
}

function parseBound(value, field, res, maximum = 10000000) {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > maximum) {
    res.status(400).json({ message: `${field} must be a valid non-negative number.` });
    return null;
  }
  return parsed;
}

router.get("/", async (req, res, next) => {
  try {
    const {
      q, category, subcategory, brand, size, minPrice, maxPrice, minDiscount, sort,
      page = "1", limit = "24",
    } = req.query;
    const min = parseBound(minPrice, "Minimum price", res);
    if (min === null) return;
    const max = parseBound(maxPrice, "Maximum price", res);
    if (max === null) return;
    const discount = parseBound(minDiscount, "Minimum discount", res, 100);
    if (discount === null) return;
    if (min !== undefined && max !== undefined && min > max) {
      return res.status(400).json({ message: "Minimum price cannot exceed maximum price." });
    }
    const query = {};
    if (q) query.$or = [
      { name: { $regex: escapeRegex(q), $options: "i" } },
      { brand: { $regex: escapeRegex(q), $options: "i" } },
    ];
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = brand;
    if (size) query.sizes = size;
    if (min !== undefined || max !== undefined) query.price = {
      ...(min !== undefined ? { $gte: min } : {}),
      ...(max !== undefined ? { $lte: max } : {}),
    };
    if (discount !== undefined) query.$expr = {
      $gte: [
        { $multiply: [{ $divide: [{ $subtract: ["$oldPrice", "$price"] }, "$oldPrice"] }, 100] },
        discount,
      ],
    };
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(60, Math.max(1, Number(limit) || 24));
    const sortBy = sort === "price-low" ? { price: 1 } : sort === "price-high"
      ? { price: -1 } : sort === "rating" ? { rating: -1 } : { popularity: -1 };
    const [items, total] = await Promise.all([
      Product.find(query).sort(sortBy).skip((pageNumber - 1) * pageSize).limit(pageSize).lean(),
      Product.countDocuments(query),
    ]);
    res.json({ items, total, page: pageNumber, pages: Math.ceil(total / pageSize) });
  } catch (error) {
    next(error);
  }
});

router.get("/:productId", async (req, res, next) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId }).lean();
    if (!product) return res.status(404).json({ message: "Product not found." });
    const reviews = await Review.find({ productId: product.productId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ product, reviews });
  } catch (error) {
    next(error);
  }
});

export default router;
