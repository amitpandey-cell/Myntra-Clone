import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, required: true, maxlength: 100 },
  body: { type: String, trim: true, required: true, maxlength: 1200 },
}, { timestamps: true });

reviewSchema.index({ productId: 1, user: 1 }, { unique: true });
export default mongoose.model("Review", reviewSchema);
