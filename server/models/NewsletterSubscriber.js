import mongoose from "mongoose";

const newsletterSubscriberSchema = new mongoose.Schema({
  email: { type: String, trim: true, lowercase: true, required: true, unique: true, maxlength: 254 },
}, { timestamps: true });

export default mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
