import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database.js";
import Product from "./models/Product.js";
import User from "./models/User.js";
import { products } from "../src/data/products.js";

await connectDatabase();

if (mongoose.connection.readyState !== 1) {
  throw new Error("Cannot seed StyleKart without a connected MongoDB database.");
}

for (const item of products) {
  const { id, ...product } = item;
  await Product.updateOne(
    { productId: id },
    { $set: { ...product, productId: id } },
    { upsert: true, runValidators: true },
  );
}
console.log(`Seeded ${products.length} catalog products.`);

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = "StyleKart Admin" } = process.env;
if (ADMIN_EMAIL || ADMIN_PASSWORD) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 10) {
    throw new Error("Set both ADMIN_EMAIL and an ADMIN_PASSWORD of at least 10 characters.");
  }
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    await user.save();
    console.log("Existing admin account role confirmed.");
  } else {
    await User.create({
      name: ADMIN_NAME,
      email,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: "admin",
    });
    console.log("Admin account created.");
  }
}

await mongoose.disconnect();
