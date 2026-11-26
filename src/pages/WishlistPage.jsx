import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useStore } from "../context/useStore";

export default function WishlistPage() {
  const { products, wishlist, toggleWishlist, addToCart } = useStore();
  const saved = products.filter((product) => wishlist.includes(product.id));

  function moveToBag(product) {
    addToCart(product);
    toggleWishlist(product.id);
  }

  return (
    <section className="shopping-page">
      <div className="page-title-row"><div><span className="eyebrow">THE PIECES YOU’RE THINKING ABOUT</span><h1>Your wishlist <span className="title-count">({saved.length})</span></h1></div></div>
      {saved.length ? (
        <div className="wishlist-grid">
          {saved.map((product) => (
            <div className="wishlist-item" key={product.id}>
              <ProductCard product={product} />
              <button className="button button-outline wishlist-move" disabled={!product.stock} onClick={() => moveToBag(product)}><ShoppingBag size={16} /> {product.stock ? "Move to bag" : "Out of stock"}</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><Heart className="empty-icon" /><h2>A little room for a favourite.</h2><p>Tap the heart on anything you love and we’ll keep it here.</p><Link className="button button-dark" to="/products">Find your favourites</Link></div>
      )}
    </section>
  );
}
