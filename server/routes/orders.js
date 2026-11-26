import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import Razorpay from "razorpay";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { authenticate } from "../middleware/auth.js";
import { requireDatabase } from "../config/database.js";

const router = Router();
const deliveryThreshold = 999;
const deliveryCharge = 99;

function getGateway() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID?.startsWith("rzp_test_") || !RAZORPAY_KEY_SECRET) {
    throw Object.assign(new Error("Razorpay test credentials are not configured."), { status: 503 });
  }
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

async function priceCart(lines, coupon) {
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > 30) {
    throw Object.assign(new Error("Your bag is empty or contains too many different items."), { status: 400 });
  }
  const grouped = new Map();
  for (const line of lines) {
    const productId = String(line.productId || "");
    const size = String(line.size || "");
    const color = String(line.color || "");
    const quantity = Number(line.quantity);
    if (!productId || !size || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw Object.assign(new Error("One or more cart items are invalid."), { status: 400 });
    }
    const key = `${productId}:${size}:${color}`;
    grouped.set(key, { productId, size, color, quantity: (grouped.get(key)?.quantity || 0) + quantity });
    if (grouped.get(key).quantity > 10) {
      throw Object.assign(new Error("A maximum of 10 of each size can be ordered at a time."), { status: 400 });
    }
  }
  const productIds = [...new Set([...grouped.values()].map((item) => item.productId))];
  const products = await Product.find({ productId: { $in: productIds } }).lean();
  const byId = new Map(products.map((product) => [product.productId, product]));
  const items = [...grouped.values()].map((line) => {
    const product = byId.get(line.productId);
    if (!product || !product.sizes.includes(line.size) || (line.color && !product.colors.includes(line.color))) {
      throw Object.assign(new Error("A product or selected size is no longer available."), { status: 409 });
    }
    if (product.stock < line.quantity) {
      throw Object.assign(new Error(`${product.name} has only ${product.stock} left in stock.`), { status: 409 });
    }
    return {
      productId: product.productId,
      brand: product.brand,
      name: product.name,
      image: product.images[0] || "",
      size: line.size,
      color: line.color || product.colors[0] || "Default",
      quantity: line.quantity,
      unitPrice: product.price,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const code = String(coupon || "").trim().toUpperCase();
  const discount = code === "STYLE10" ? Math.round(subtotal * 0.1) : 0;
  const deliveryFee = code === "FREESHIP" || subtotal >= deliveryThreshold ? 0 : deliveryCharge;
  if (code && !["STYLE10", "FREESHIP"].includes(code)) {
    throw Object.assign(new Error("That coupon code is not valid."), { status: 400 });
  }
  return { items, subtotal, discount, deliveryFee, total: subtotal - discount + deliveryFee, coupon: code };
}

async function reserveStock(items) {
  const reserved = [];
  try {
    for (const item of items) {
      const result = await Product.updateOne(
        { productId: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
      );
      if (result.modifiedCount !== 1) {
        throw Object.assign(new Error(`${item.name} is no longer available in the requested quantity.`), { status: 409 });
      }
      reserved.push(item);
    }
  } catch (error) {
    await Promise.all(reserved.map((item) =>
      Product.updateOne({ productId: item.productId }, { $inc: { stock: item.quantity } }),
    ));
    throw error;
  }
}

async function createOrder(req, res, payment = {}) {
  const input = req.body.shippingAddress || {};
  const address = Object.fromEntries(
    ["label", "fullName", "phone", "line1", "line2", "city", "state", "pincode"]
      .map((field) => [field, typeof input[field] === "string" ? input[field].trim() : ""]),
  );
  if (!address.fullName || address.fullName.length > 100
    || !/^[0-9]{10}$/.test(address.phone)
    || !address.line1 || address.line1.length > 160 || address.line2.length > 160
    || !address.city || address.city.length > 80 || !address.state || address.state.length > 80
    || !/^[0-9]{6}$/.test(address.pincode) || address.label.length > 40) {
    return res.status(400).json({ message: "Add a complete shipping address with a 6-digit pincode." });
  }
  const totals = await priceCart(req.body.items, req.body.coupon);
  await reserveStock(totals.items);
  try {
    const order = await Order.create({
      orderNumber: `SK-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`,
      user: req.user.id,
      shippingAddress: address,
      ...totals,
      paymentMethod: payment.method || "cod",
      paymentStatus: payment.status || "pending",
      razorpayOrderId: payment.razorpayOrderId || undefined,
      razorpayPaymentId: payment.razorpayPaymentId || undefined,
    });
    res.status(201).json({ order });
  } catch (error) {
    await Promise.all(totals.items.map((item) =>
      Product.updateOne({ productId: item.productId }, { $inc: { stock: item.quantity } }),
    ));
    if (error.code === 11000 && payment.razorpayPaymentId) {
      return res.status(409).json({ message: "This payment has already been attached to an order." });
    }
    throw error;
  }
}

router.use(requireDatabase, authenticate);

router.get("/", async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

router.get("/:orderId", async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id }).lean();
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    await createOrder(req, res);
  } catch (error) {
    next(error);
  }
});

router.post("/razorpay/create", async (req, res, next) => {
  try {
    const totals = await priceCart(req.body.items, req.body.coupon);
    const gateway = getGateway();
    const receipt = `SK-${Date.now()}-${randomBytes(3).toString("hex")}`;
    const gatewayOrder = await gateway.orders.create({
      amount: Math.round(totals.total * 100),
      currency: "INR",
      receipt,
    });
    res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      gatewayOrderId: gatewayOrder.id,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/razorpay/verify", async (req, res, next) => {
  try {
    const gateway = getGateway();
    const { gatewayOrderId, paymentId, signature } = req.body;
    if (![gatewayOrderId, paymentId, signature].every((value) => typeof value === "string" && value.length < 200)) {
      return res.status(400).json({ message: "Payment verification details are incomplete." });
    }
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${gatewayOrderId}|${paymentId}`).digest();
    const provided = Buffer.from(signature, "hex");
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return res.status(400).json({ message: "Payment signature verification failed." });
    }
    const [gatewayOrder, payment] = await Promise.all([
      gateway.orders.fetch(gatewayOrderId),
      gateway.payments.fetch(paymentId),
    ]);
    const totals = await priceCart(req.body.items, req.body.coupon);
    if (payment.order_id !== gatewayOrderId || payment.status !== "captured"
      || gatewayOrder.amount !== Math.round(totals.total * 100)) {
      return res.status(400).json({ message: "The payment could not be verified against this order." });
    }
    if (await Order.exists({ razorpayPaymentId: paymentId })) {
      return res.status(409).json({ message: "This payment has already been attached to an order." });
    }
    await createOrder(req, res, {
      method: "razorpay",
      status: "paid",
      razorpayOrderId: gatewayOrderId,
      razorpayPaymentId: paymentId,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:orderId/cancel", async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.status !== "processing" || order.paymentStatus === "paid") {
      return res.status(409).json({ message: "Only unpaid orders that are still processing can be cancelled. Contact support for payment assistance." });
    }
    order.status = "cancelled";
    order.cancellationReason = String(req.body.reason || "").slice(0, 300);
    await order.save();
    await Promise.all(order.items.map((item) =>
      Product.updateOne({ productId: item.productId }, { $inc: { stock: item.quantity } }),
    ));
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

router.post("/:orderId/return", async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found." });
    const returnWindowOpen = Date.now() - order.updatedAt.getTime() <= 7 * 24 * 60 * 60 * 1000;
    if (order.status !== "delivered" || !returnWindowOpen || order.returnStatus !== "none") {
      return res.status(409).json({ message: "This order is not eligible for a return request." });
    }
    order.returnStatus = "requested";
    await order.save();
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

export default router;
