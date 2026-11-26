const fashionImage = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=85`;

const departmentForCategory = (category) => {
  if (category.startsWith("mens-")) return "Men";
  if (category.startsWith("womens-") || category === "tops") return "Women";
  if (category.startsWith("kids-")) return "Kids";
  if (["beauty", "fragrances", "skin-care"].includes(category)) return "Beauty";
  if (["furniture", "home-decoration", "kitchen-accessories"].includes(category)) return "Home";
  return "Other";
};

const formatCategory = (category) => {
  const label = category.replace(/-/g, " ");
  if (label.startsWith("mens ")) return `Men's ${label.slice(5)}`;
  if (label.startsWith("womens ")) return `Women's ${label.slice(7)}`;
  return label.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export function normalizeDummyProduct(item) {
  const apiCategory = typeof item.category === "string" ? item.category : "other";
  const price = Number(item.price);
  const discount = Math.min(95, Math.max(0, Number(item.discountPercentage) || 0));
  const images = [...new Set([
    ...(Array.isArray(item.images) ? item.images : []),
    item.thumbnail,
  ].filter((image) => typeof image === "string" && /^https?:\/\//i.test(image)))].slice(0, 4);

  return {
    id: `dummy-${item.id}`,
    brand: item.brand || "StyleKart",
    name: item.title,
    category: departmentForCategory(apiCategory),
    subcategory: formatCategory(apiCategory),
    apiCategory,
    price,
    oldPrice: Math.round(price / (1 - discount / 100)),
    popularity: Math.round((Number(item.rating) || 0) * 20),
    images,
    description: item.description || "",
    sizes: ["One Size"],
    colors: ["Default"],
    stock: Math.max(0, Number(item.stock) || 0),
    featured: Number(item.rating) >= 4.5,
    bestseller: Number(item.rating) >= 4,
    rating: Number(item.rating) || 0,
    reviewCount: Array.isArray(item.reviews) ? item.reviews.length : 0,
  };
}

export async function fetchDummyProducts() {
  const response = await fetch("https://dummyjson.com/products?limit=0");
  if (!response.ok) {
    throw new Error(`DummyJSON product request failed (${response.status}).`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload.products)) {
    throw new Error("DummyJSON returned an invalid product list.");
  }
  return payload.products
    .map(normalizeDummyProduct)
    .filter((product) => product.name && product.images.length > 0);
}

export const products = [
  { id: "men-tee-01", brand: "Roadster", name: "Everyday Cotton Crew T-shirt", category: "Men", subcategory: "T-Shirts", price: 499, oldPrice: 999, popularity: 96, images: [fashionImage("photo-1521572163474-6864f9cf17ab"), fashionImage("photo-1523381210434-271e8be1f52b")], description: "A soft, breathable cotton tee made for everyday comfort. Cut in a relaxed fit with a classic crew neckline.", sizes: ["S", "M", "L", "XL"], colors: ["White", "Black", "Olive"], stock: 32, featured: true, bestseller: true, rating: 4.5, reviewCount: 128 },
  { id: "men-shirt-01", brand: "Dennis Lingo", name: "Textured Slim-Fit Casual Shirt", category: "Men", subcategory: "Shirts", price: 899, oldPrice: 1799, popularity: 89, images: [fashionImage("photo-1603252109303-2751441dd157")], description: "A polished cotton-blend shirt with a subtle texture and versatile slim fit.", sizes: ["S", "M", "L", "XL"], colors: ["Blue", "White"], stock: 20, featured: true, bestseller: false, rating: 4.3, reviewCount: 64 },
  { id: "men-jeans-01", brand: "Levis", name: "511 Slim Tapered Blue Jeans", category: "Men", subcategory: "Jeans", price: 1999, oldPrice: 3499, popularity: 94, images: [fashionImage("photo-1542272604-787c3835535d")], description: "Classic five-pocket denim with a comfortable stretch and a clean tapered leg.", sizes: ["30", "32", "34", "36"], colors: ["Indigo", "Black"], stock: 18, featured: false, bestseller: true, rating: 4.7, reviewCount: 240 },
  { id: "men-trouser-01", brand: "HIGHLANDER", name: "Classic Straight-Fit Chinos", category: "Men", subcategory: "Trousers", price: 1099, oldPrice: 2199, popularity: 78, images: [fashionImage("photo-1473966968600-fa801b869a1a")], description: "Easy-care chinos with a straight fit, made to take you from weekdays to weekends.", sizes: ["30", "32", "34", "36"], colors: ["Beige", "Navy"], stock: 25, featured: false, bestseller: false, rating: 4.2, reviewCount: 39 },
  { id: "men-jacket-01", brand: "Roadster", name: "Washed Denim Trucker Jacket", category: "Men", subcategory: "Jackets", price: 1799, oldPrice: 3599, popularity: 91, images: [fashionImage("photo-1551028719-00167b16eac5")], description: "A wardrobe staple in durable washed denim, finished with classic metal buttons.", sizes: ["S", "M", "L", "XL"], colors: ["Light blue", "Charcoal"], stock: 12, featured: true, bestseller: false, rating: 4.6, reviewCount: 72 },
  { id: "men-shoe-01", brand: "HRX", name: "Stride Everyday Running Shoes", category: "Men", subcategory: "Shoes", price: 1599, oldPrice: 2999, popularity: 88, images: [fashionImage("photo-1542291026-7eec264c27ff"), fashionImage("photo-1600185365483-26d7a4cc7519")], description: "Lightweight trainers with a cushioned sole and grippy outsole for daily miles.", sizes: ["7", "8", "9", "10", "11"], colors: ["Red", "Black"], stock: 16, featured: false, bestseller: true, rating: 4.4, reviewCount: 102 },
  { id: "men-watch-01", brand: "Fossil", name: "Minimalist Steel Analog Watch", category: "Men", subcategory: "Watches", price: 3499, oldPrice: 5999, popularity: 73, images: [fashionImage("photo-1524592094714-0f0654e20314")], description: "A refined stainless-steel watch with a minimalist dial and reliable quartz movement.", sizes: ["One Size"], colors: ["Silver", "Gold"], stock: 9, featured: false, bestseller: false, rating: 4.5, reviewCount: 51 },
  { id: "women-dress-01", brand: "Tokyo Talkies", name: "Floral Fit & Flare Midi Dress", category: "Women", subcategory: "Dresses", price: 1299, oldPrice: 2599, popularity: 98, images: [fashionImage("photo-1539008835657-9e8e9680c956"), fashionImage("photo-1572804013309-59a88b7e92f1")], description: "A breezy floral midi with a flattering waist and an easy fit for brunches and beyond.", sizes: ["XS", "S", "M", "L", "XL"], colors: ["Floral pink", "Blue"], stock: 22, featured: true, bestseller: true, rating: 4.7, reviewCount: 184 },
  { id: "women-top-01", brand: "SASSAFRAS", name: "Ribbed Square-Neck Top", category: "Women", subcategory: "Tops", price: 699, oldPrice: 1399, popularity: 86, images: [fashionImage("photo-1551163943-3f6a855d1153")], description: "A soft ribbed knit top with a modern square neckline and versatile fitted silhouette.", sizes: ["XS", "S", "M", "L"], colors: ["Cream", "Black", "Rose"], stock: 28, featured: true, bestseller: false, rating: 4.3, reviewCount: 77 },
  { id: "women-saree-01", brand: "Anouk", name: "Woven Festive Silk-Blend Saree", category: "Women", subcategory: "Sarees", price: 2499, oldPrice: 4999, popularity: 80, images: [fashionImage("photo-1610030469983-98e550d6193c")], description: "A graceful silk-blend drape with woven detailing, paired with an unstitched blouse piece.", sizes: ["One Size"], colors: ["Wine", "Emerald"], stock: 10, featured: false, bestseller: false, rating: 4.6, reviewCount: 48 },
  { id: "women-kurti-01", brand: "Biba", name: "Printed Straight Kurta", category: "Women", subcategory: "Kurtis", price: 999, oldPrice: 1999, popularity: 85, images: [fashionImage("photo-1583391733956-6c78276477e3")], description: "An airy cotton kurta with an all-over print and a comfortable straight silhouette.", sizes: ["S", "M", "L", "XL", "XXL"], colors: ["Mustard", "Teal"], stock: 21, featured: false, bestseller: true, rating: 4.4, reviewCount: 91 },
  { id: "women-jeans-01", brand: "Levis", name: "High-Rise Straight Jeans", category: "Women", subcategory: "Jeans", price: 1899, oldPrice: 3299, popularity: 90, images: [fashionImage("photo-1541099649105-f69ad21f3246")], description: "High-rise denim with a straight leg and just-right stretch for all-day wear.", sizes: ["26", "28", "30", "32", "34"], colors: ["Blue", "Black"], stock: 17, featured: false, bestseller: true, rating: 4.5, reviewCount: 139 },
  { id: "women-bag-01", brand: "Lavie", name: "Structured Everyday Shoulder Bag", category: "Women", subcategory: "Handbags", price: 1499, oldPrice: 2999, popularity: 82, images: [fashionImage("photo-1584917865442-de89df76afd3")], description: "A roomy, structured bag with an adjustable strap and considered everyday compartments.", sizes: ["One Size"], colors: ["Tan", "Black"], stock: 14, featured: true, bestseller: false, rating: 4.3, reviewCount: 58 },
  { id: "women-shoe-01", brand: "Bata", name: "Luna Comfort Ballet Flats", category: "Women", subcategory: "Footwear", price: 899, oldPrice: 1799, popularity: 79, images: [fashionImage("photo-1543163521-1bf539c55dd2")], description: "Soft, flexible flats with cushioned footbeds that pair easily with work and weekend looks.", sizes: ["5", "6", "7", "8", "9"], colors: ["Nude", "Black"], stock: 19, featured: false, bestseller: false, rating: 4.2, reviewCount: 44 },
  { id: "kids-boy-01", brand: "Puma", name: "Boys Colourblock Cotton Tee", category: "Kids", subcategory: "Boys Clothing", price: 599, oldPrice: 1199, popularity: 71, images: [fashionImage("photo-1503919005314-30d93d07d823")], description: "A soft cotton tee with playful colourblocking for school breaks and weekend adventures.", sizes: ["4Y", "6Y", "8Y", "10Y"], colors: ["Blue", "Green"], stock: 15, featured: false, bestseller: false, rating: 4.4, reviewCount: 32 },
  { id: "kids-girl-01", brand: "YK", name: "Girls Tiered Party Dress", category: "Kids", subcategory: "Girls Clothing", price: 1099, oldPrice: 2199, popularity: 76, images: [fashionImage("photo-1503944583220-79d8926ad5e2")], description: "A lightweight tiered dress with a soft lining and a little extra twirl.", sizes: ["4Y", "6Y", "8Y", "10Y"], colors: ["Lavender", "Pink"], stock: 11, featured: true, bestseller: false, rating: 4.6, reviewCount: 41 },
  { id: "kids-shoe-01", brand: "Skechers", name: "Kids' Play-Day Trainers", category: "Kids", subcategory: "Shoes", price: 1399, oldPrice: 2499, popularity: 68, images: [fashionImage("photo-151-5965655551-9c2a42c8d322")], description: "Easy-on trainers with a flexible sole and cushioned support for busy little feet.", sizes: ["1", "2", "3", "4", "5"], colors: ["Navy", "Pink"], stock: 8, featured: false, bestseller: true, rating: 4.5, reviewCount: 26 },
  { id: "kids-bag-01", brand: "Skybags", name: "Mini Daytrip Backpack", category: "Kids", subcategory: "Accessories", price: 799, oldPrice: 1599, popularity: 64, images: [fashionImage("photo-1553062407-98eeb64c6a62")], description: "A compact, lightweight backpack with adjustable straps and an easy-access front pocket.", sizes: ["One Size"], colors: ["Blue", "Coral"], stock: 13, featured: false, bestseller: false, rating: 4.1, reviewCount: 19 },
  { id: "beauty-makeup-01", brand: "Maybelline", name: "Fit Me Matte + Poreless Foundation", category: "Beauty", subcategory: "Makeup", price: 549, oldPrice: 799, popularity: 92, images: [fashionImage("photo-1522335789203-aabd1fc54bc9")], description: "A lightweight, natural-looking foundation with a soft matte finish. Shade selection available in store.", sizes: ["One Size"], colors: ["Natural beige", "Warm nude"], stock: 30, featured: true, bestseller: true, rating: 4.4, reviewCount: 212 },
  { id: "beauty-skin-01", brand: "The Ordinary", name: "Hydrating Hyaluronic Serum", category: "Beauty", subcategory: "Skincare", price: 899, oldPrice: 1199, popularity: 87, images: [fashionImage("photo-1608248543803-ba4f8c70ae0b")], description: "A lightweight hydrating serum formulated to support soft, comfortable-feeling skin.", sizes: ["One Size"], colors: ["Clear"], stock: 24, featured: true, bestseller: false, rating: 4.6, reviewCount: 156 },
  { id: "beauty-hair-01", brand: "L'Oreal Paris", name: "Extraordinary Oil Hair Serum", category: "Beauty", subcategory: "Haircare", price: 499, oldPrice: 799, popularity: 74, images: [fashionImage("photo-1527799820374-dcf8d9d4a388")], description: "A lightweight finishing serum that adds shine and helps smooth dry-looking lengths.", sizes: ["One Size"], colors: ["Clear"], stock: 27, featured: false, bestseller: false, rating: 4.3, reviewCount: 88 },
  { id: "home-cushion-01", brand: "Haus & Hues", name: "Textured Cotton Cushion Cover Set", category: "Home", subcategory: "Home Decor", price: 699, oldPrice: 1399, popularity: 66, images: [fashionImage("photo-1584100936595-c0654b55a2e2")], description: "A set of two textured cotton cushion covers in versatile tones for an easy room refresh.", sizes: ["40 × 40 cm"], colors: ["Sand", "Sage"], stock: 20, featured: false, bestseller: false, rating: 4.2, reviewCount: 21 },
  { id: "home-throw-01", brand: "Ellementry", name: "Soft Woven Cotton Throw", category: "Home", subcategory: "Soft Furnishings", price: 1299, oldPrice: 2499, popularity: 69, images: [fashionImage("photo-1600210492486-724fe5c67fb0")], description: "A soft woven throw for layering over your sofa or bed, finished with subtle fringe.", sizes: ["One Size"], colors: ["Ivory", "Terracotta"], stock: 12, featured: true, bestseller: false, rating: 4.5, reviewCount: 35 },
  { id: "home-lamp-01", brand: "Chumbak", name: "Ceramic Table Lamp", category: "Home", subcategory: "Lighting", price: 1799, oldPrice: 2999, popularity: 62, images: [fashionImage("photo-1507473885765-e6ed057f782c")], description: "A compact ceramic table lamp with a warm, softly diffused glow for cosy corners.", sizes: ["One Size"], colors: ["Blush", "Cream"], stock: 7, featured: false, bestseller: false, rating: 4.4, reviewCount: 17 },
];
