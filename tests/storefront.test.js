import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDummyProduct, products } from "../src/data/products.js";
import { calculateTotals } from "../src/lib/pricing.js";

test("sample catalog covers the five departments with at least twenty products", () => {
  assert.ok(products.length >= 20);
  assert.deepEqual(
    new Set(products.map((product) => product.category)),
    new Set(["Men", "Women", "Kids", "Beauty", "Home"]),
  );
  assert.ok(products.every((product) => product.images.length > 0 && product.stock >= 0));
});

test("cart totals include discounts and delivery thresholds", () => {
  const cart = [{ product: { price: 600 }, quantity: 2 }];
  assert.deepEqual(calculateTotals(cart), { subtotal: 1200, discount: 0, delivery: 0, total: 1200 });
  assert.deepEqual(calculateTotals(cart, "STYLE10"), { subtotal: 1200, discount: 120, delivery: 0, total: 1080 });
  assert.deepEqual(
    calculateTotals([{ product: { price: 500 }, quantity: 1 }], "FREESHIP"),
    { subtotal: 500, discount: 0, delivery: 0, total: 500 },
  );
  assert.deepEqual(calculateTotals([]), { subtotal: 0, discount: 0, delivery: 0, total: 0 });
});

test("DummyJSON products keep API images and map into storefront departments", () => {
  const product = normalizeDummyProduct({
    id: 7,
    title: "Cotton Shirt",
    brand: "Example",
    category: "mens-shirts",
    price: 20,
    discountPercentage: 10,
    rating: 4.5,
    stock: 12,
    images: ["https://cdn.dummyjson.com/shirt.webp"],
  });

  assert.equal(product.id, "dummy-7");
  assert.equal(product.category, "Men");
  assert.equal(product.subcategory, "Men's shirts");
  assert.equal(product.oldPrice, 22);
  assert.deepEqual(product.images, ["https://cdn.dummyjson.com/shirt.webp"]);
});
