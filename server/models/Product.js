import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productId: { type: String, unique: true, required: true, index: true },
  brand: { type: String, required: true, trim: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  category: { type: String, required: true, trim: true, index: true },
  subcategory: { type: String, required: true, trim: true, index: true },
  price: { type: Number, required: true, min: 0.01 },
  oldPrice: { type: Number, required: true, min: 0.01 },
  popularity: { type: Number, default: 0 },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: (images) => images.length > 0 && images.every((image) => /^https?:\/\//i.test(image)),
      message: "Add at least one valid product image URL.",
    },
  },
  description: { type: String, required: true, maxlength: 2000 },
  sizes: { type: [String], default: ["One Size"], validate: (sizes) => sizes.length > 0 },
  colors: { type: [String], default: ["Default"], validate: (colors) => colors.length > 0 },
  stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
  featured: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

productSchema.pre("validate", function validatePrices(next) {
  if (this.oldPrice < this.price) {
    this.invalidate("oldPrice", "Original price must be greater than or equal to the selling price.");
  }
  next();
});

export default mongoose.model("Product", productSchema);
