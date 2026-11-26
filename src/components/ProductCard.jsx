import { Heart, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../context/useStore";
import { formatPrice } from "../lib/api";

export default function ProductCard({ product, compact = false }) {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const liked = wishlist.includes(product.id);
  const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);

  return (
    <article className={`product-card ${compact ? "product-card-compact" : ""}`}>
      <div className="product-card-image">
        <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
          <img src={product.images[0]} alt={product.name} loading="lazy" />
        </Link>
        <button className={`wishlist-toggle ${liked ? "is-liked" : ""}`} aria-label={liked ? "Remove from wishlist" : "Add to wishlist"} onClick={() => toggleWishlist(product.id)}>
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
        </button>
        <span className="discount-tag">{discount}% OFF</span>
        {product.stock < 5 && <span className="stock-tag">Only {product.stock} left</span>}
      </div>
      <div className="product-card-info">
        <div className="product-meta">
          <span className="product-brand">{product.brand}</span>
          <span className="product-rating"><Star size={13} fill="currentColor" /> {(product.rating || 0).toFixed(1)}</span>
        </div>
        <Link className="product-name" to={`/product/${product.id}`}>{product.name}</Link>
        <div className="product-prices"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.oldPrice)}</del></div>
        <button className="button button-outline card-add-button" disabled={!product.stock} onClick={() => addToCart(product)}>
          <ShoppingBag size={16} /> {product.stock ? "Add to bag" : "Out of stock"}
        </button>
      </div>
    </article>
  );
}
