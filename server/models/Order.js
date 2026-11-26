import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  brand: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, default: "" },
  size: { type: String, required: true },
  color: { type: String, required: true, default: "Default" },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items: { type: [orderItemSchema], required: true },
  shippingAddress: { type: mongoose.Schema.Types.Mixed, required: true },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  coupon: { type: String, default: "" },
  paymentMethod: { type: String, enum: ["cod", "razorpay"], required: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ["processing", "packed", "shipped", "delivered", "cancelled"], default: "processing" },
  returnStatus: { type: String, enum: ["none", "requested", "approved", "rejected"], default: "none" },
  trackingNumber: { type: String, default: "" },
  cancellationReason: { type: String, default: "" },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
