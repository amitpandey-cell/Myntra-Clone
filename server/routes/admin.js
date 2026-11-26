import { Router } from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { requireDatabase } from "../config/database.js";

const router = Router();
router.use(requireDatabase, authenticate, requireAdmin);

router.get("/stats", async (_req, res, next) => {
  try {
    const [users, products, orders, revenue] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod", status: "delivered" }] } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);
    res.json({ users, products, orders, revenue: revenue[0]?.total || 0 });
  } catch (error) {
    next(error);
  }
});

router.get("/products", async (_req, res, next) => {
  try {
    const products = await Product.find().sort({ updatedAt: -1 }).limit(500).lean();
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    if (Number(req.body.oldPrice) < Number(req.body.price)) {
      return res.status(400).json({ message: "Original price must be greater than or equal to selling price." });
    }
    const product = await Product.create(req.body);
    res.status(201).json({ product });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That product ID already exists." });
    next(error);
  }
});

router.put("/products/:id", async (req, res, next) => {
  try {
    if (Number(req.body.oldPrice) < Number(req.body.price)) {
      return res.status(400).json({ message: "Original price must be greater than or equal to selling price." });
    }
    const product = await Product.findOneAndUpdate(
      { productId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ productId: req.params.id });
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product removed." });
  } catch (error) {
    next(error);
  }
});

router.get("/orders", async (_req, res, next) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 }).limit(300).lean();
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid order ID." });
    const allowed = ["processing", "packed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Choose a valid order status." });
    const currentOrder = await Order.findById(req.params.id);
    if (!currentOrder) return res.status(404).json({ message: "Order not found." });
    if (currentOrder.status === "cancelled" && req.body.status !== "cancelled") {
      return res.status(409).json({ message: "A cancelled order cannot be reopened." });
    }
    if (req.body.status === "cancelled" && currentOrder.status !== "cancelled"
      && (currentOrder.status !== "processing" || currentOrder.paymentStatus === "paid")) {
      return res.status(409).json({ message: "Only unpaid orders that are still processing can be cancelled." });
    }
    const update = { status: req.body.status };
    if (req.body.trackingNumber !== undefined) update.trackingNumber = String(req.body.trackingNumber).slice(0, 100);
    if (req.body.returnStatus && ["approved", "rejected"].includes(req.body.returnStatus)) update.returnStatus = req.body.returnStatus;
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (req.body.status === "cancelled" && currentOrder.status !== "cancelled") {
      await Promise.all(currentOrder.items.map((item) =>
        Product.updateOne({ productId: item.productId }, { $inc: { stock: item.quantity } }),
      ));
    }
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (_req, res, next) => {
  try {
    const users = await User.find().select("name email role createdAt").sort({ createdAt: -1 }).limit(500).lean();
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !["customer", "admin"].includes(req.body.role)) {
      return res.status(400).json({ message: "Invalid user or role." });
    }
    if (req.params.id === req.user.id && req.body.role !== "admin") {
      return res.status(400).json({ message: "You cannot remove your own administrator access." });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true })
      .select("name email role");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
