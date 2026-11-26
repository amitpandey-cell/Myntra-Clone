import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Minus, Plus, Star, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useStore } from "../context/useStore";
import { api, formatPrice } from "../lib/api";

export default function ProductPage() {
  const { productId } = useParams();
  const { products, addToCart, user, databaseReady, notify } = useStore();
  const product = products.find((item) => item.id === productId);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewError, setReviewError] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  useEffect(() => {
    if (!product || !databaseReady) return;
    let active = true;
    api(`/reviews/${product.id}`)
      .then(({ reviews: currentReviews }) => active && setReviews(currentReviews))
      .catch((error) => active && setReviewError(error.message));
    return () => { active = false; };
  }, [product, databaseReady]);

  if (!product) {
    return <section className="state-card"><span className="eyebrow">404 — NOT FOUND</span><h1>This piece has moved on.</h1><p>Explore the collection to find something new.</p><Link className="button button-dark" to="/products">Shop all</Link></section>;
  }

  const similar = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);
  const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  const selectedSize = product.sizes.includes(size) ? size : product.sizes[0];
  const selectedColor = product.colors.includes(color) ? color : product.colors[0];
  const safeQuantity = Math.min(quantity, product.stock);

  function checkDelivery(event) {
    event.preventDefault();
    if (!/^[0-9]{6}$/.test(pincode)) {
      setDeliveryMessage("Enter a valid 6-digit pincode.");
      return;
    }
    setDeliveryMessage(`Pincode format confirmed. Final delivery availability will be confirmed at checkout.`);
  }

  function buyNow() {
    if (!selectedSize) {
      notify("Choose a size before adding this piece.", "error");
      return;
    }
    addToCart(product, selectedSize, safeQuantity, selectedColor);
    window.location.assign("/cart");
  }

  async function submitReview(event) {
    event.preventDefault();
    setSubmittingReview(true);
    setReviewError("");
    try {
      const { review } = await api(`/reviews/${product.id}`, { method: "POST", body: JSON.stringify(reviewForm) });
      setReviews((current) => [review, ...current]);
      setReviewForm({ rating: 5, title: "", body: "" });
      notify("Thanks for sharing your review.");
    } catch (error) {
      setReviewError(error.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="product-detail-page">
      <div className="breadcrumbs"><Link to="/products"><ArrowLeft size={14} /> Back to collection</Link><span>/</span><span>{product.category}</span><span>/</span><span>{product.subcategory}</span></div>
      <div className="product-detail">
        <div className="detail-gallery">
          <div className="detail-main-image"><img src={product.images[0]} alt={product.name} /></div>
          {product.images.slice(1).map((image) => <div className="detail-main-image" key={image}><img src={image} alt={`${product.name} view`} /></div>)}
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{product.category} / {product.subcategory}</span>
          <h1>{product.brand}</h1>
          <p className="detail-product-name">{product.name}</p>
          <div className="detail-rating"><span><Star size={15} fill="currentColor" /> {(product.rating || 0).toFixed(1)}</span><a href="#reviews">{product.reviewCount} reviews</a></div>
          <div className="detail-price"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.oldPrice)}</del><span>{discount}% off</span></div>
          <p className="tax-note">Inclusive of all taxes</p>
          <p className="detail-description">{product.description}</p>
          <div className="choice-heading"><span>Colour: <b>{selectedColor}</b></span></div>
          <div className="color-options">{product.colors.map((item, index) => <button className={`color-chip ${selectedColor === item ? "selected" : ""}`} key={item} onClick={() => setColor(item)} aria-label={`Choose ${item}`}><span className={`swatch swatch-${index % 5}`} />{item}</button>)}</div>
          <div className="choice-heading size-heading"><span>Choose size</span><button className="text-button" onClick={() => document.getElementById("size-guide").showModal()}>Size guide</button></div>
          <div className="size-options">{product.sizes.map((item) => <button className={selectedSize === item ? "size-chip selected" : "size-chip"} key={item} onClick={() => setSize(item)}>{item}</button>)}</div>
          <div className="choice-heading"><span>Quantity</span><span className="stock-hint">{product.stock} in stock</span></div>
          <div className="quantity-picker">
            <button aria-label="Decrease quantity" disabled={safeQuantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button>
            <span>{safeQuantity}</span>
            <button aria-label="Increase quantity" disabled={safeQuantity >= product.stock} onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}><Plus size={15} /></button>
          </div>
          <div className="detail-actions">
            <button className="button button-dark" disabled={!product.stock} onClick={() => addToCart(product, selectedSize, safeQuantity, selectedColor)}>Add to bag</button>
            <button className="button button-outline" disabled={!product.stock} onClick={buyNow}>Buy now</button>
          </div>
          <form className="pincode-check" onSubmit={checkDelivery}>
            <label htmlFor="delivery-pincode"><Truck size={17} /> Check delivery availability</label>
            <div><input id="delivery-pincode" inputMode="numeric" maxLength="6" placeholder="Enter pincode" value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))} /><button type="submit">Check</button></div>
            {deliveryMessage && <small role="status">{deliveryMessage}</small>}
          </form>
          <div className="assurance-row"><span><Check size={16} /> Easy returns within 7 days</span><span><Check size={16} /> Secure checkout</span></div>
          <dialog id="size-guide" className="size-guide-dialog">
            <button className="dialog-close" onClick={() => document.getElementById("size-guide").close()} aria-label="Close size guide">×</button>
            <span className="eyebrow">THE RIGHT FIT</span><h2>Size guide</h2><p>Sizes are product-specific. Check the label below for the available options.</p>
            <div className="size-guide-list">{product.sizes.map((item) => <span key={item}>{item}</span>)}</div>
          </dialog>
        </div>
      </div>
      <section className="reviews-section" id="reviews">
        <div className="section-heading"><div><span className="eyebrow">REAL PEOPLE, REAL NOTES</span><h2>Reviews <span className="review-count">({product.reviewCount})</span></h2></div></div>
        {databaseReady && user ? (
          <form className="review-form" onSubmit={submitReview}>
            <label>Your rating <select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}>{[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} stars</option>)}</select></label>
            <label>Title <input required maxLength={100} value={reviewForm.title} onChange={(event) => setReviewForm({ ...reviewForm, title: event.target.value })} /></label>
            <label>Your review <textarea required maxLength={1200} rows="3" value={reviewForm.body} onChange={(event) => setReviewForm({ ...reviewForm, body: event.target.value })} /></label>
            <button className="button button-dark" disabled={submittingReview}>{submittingReview ? "Posting..." : "Post review"}</button>
          </form>
        ) : databaseReady
          ? <p className="muted-copy"><Link to="/login">Sign in</Link> to share a review.</p>
          : <p className="muted-copy">Connect the API and MongoDB to load and leave customer reviews.</p>}
        {reviewError && <p className="inline-error" role="alert">{reviewError}</p>}
        <div className="review-list">
          {reviews.map((review) => <article className="review-card" key={review._id}><div className="review-card-top"><b>{review.userName}</b><span><Star size={14} fill="currentColor" /> {review.rating}</span></div><h3>{review.title}</h3><p>{review.body}</p><small>{new Date(review.createdAt).toLocaleDateString()}</small></article>)}
          {!reviews.length && <p className="muted-copy">No written reviews yet. Be the first to share what you think.</p>}
        </div>
      </section>
      {similar.length > 0 && <section className="section-block product-section"><div className="section-heading"><div><span className="eyebrow">MORE TO LOVE</span><h2>You may also like</h2></div><Link className="text-link" to={`/products?category=${product.category}`}>More {product.category} <ChevronRight size={16} /></Link></div><div className="product-grid">{similar.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    </div>
  );
}
