import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 40, default: "Home" },
  fullName: { type: String, trim: true, required: true, maxlength: 100 },
  phone: { type: String, trim: true, required: true, match: /^[0-9]{10}$/ },
  line1: { type: String, trim: true, required: true, maxlength: 160 },
  line2: { type: String, trim: true, maxlength: 160, default: "" },
  city: { type: String, trim: true, required: true, maxlength: 80 },
  state: { type: String, trim: true, required: true, maxlength: 80 },
  pincode: { type: String, trim: true, required: true, match: /^[0-9]{6}$/ },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, required: true, unique: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  addresses: { type: [addressSchema], default: [] },
  resetTokenHash: { type: String, select: false },
  resetTokenExpires: { type: Date, select: false },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
