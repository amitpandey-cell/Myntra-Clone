import { useState } from "react";
import { ArrowRight, Minus, Plus, Tag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../context/useStore";
import { formatPrice } from "../lib/api";
import { calculateTotals } from "../lib/pricing";

export default function CartPage() {
  const { cart, updateQuantity, notify } = useStore();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(() => localStorage.getItem("stylekart-coupon") || "");
  const [couponMessage, setCouponMessage] = useState(() => coupon ? `${coupon} applied.` : "");
  const totals = calculateTotals(cart, coupon);

  function applyCoupon(event) {
    event.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!["STYLE10", "FREESHIP"].includes(code)) {
      setCoupon("");
      localStorage.removeItem("stylekart-coupon");
      setCouponMessage("That code didn’t work. Try STYLE10 or FREESHIP.");
      return;
    }
    setCoupon(code);
    localStorage.setItem("stylekart-coupon", code);
    setCouponMessage(`${code} applied to your bag.`);
    notify("Your offer has been applied.");
  }

  return (
    <section className="shopping-page">
      <div className="page-title-row"><div><span className="eyebrow">YOUR EDIT, YOUR WAY</span><h1>Your bag <span className="title-count">({cart.reduce((sum, item) => sum + item.quantity, 0)})</span></h1></div><Link className="text-link" to="/products">Keep browsing <ArrowRight size={16} /></Link></div>
      {cart.length ? (
        <div className="cart-layout">
          <div className="cart-lines">
            {cart.map((item) => (
              <article className="cart-line" key={`${item.productId}-${item.size}-${item.color}`}>
                <Link to={`/product/${item.productId}`} className="cart-line-image"><img src={item.product.images[0]} alt={item.product.name} /></Link>
                <div className="cart-line-info">
                  <span className="product-brand">{item.product.brand}</span><Link className="product-name" to={`/product/${item.productId}`}>{item.product.name}</Link>
                  <span className="cart-line-meta">Size: {item.size} · Colour: {item.color}</span>
                  <div className="cart-line-bottom">
                    <div className="quantity-picker">
                      <button aria-label={`Decrease ${item.product.name} quantity`} onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}><Minus size={14} /></button>
                      <span>{item.quantity}</span>
                      <button aria-label={`Increase ${item.product.name} quantity`} disabled={item.quantity >= item.product.stock} onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}><Plus size={14} /></button>
                    </div>
                    <button className="remove-line" onClick={() => updateQuantity(item.productId, item.size, item.color, 0)}><Trash2 size={15} /> Remove</button>
                    <strong>{formatPrice(item.product.price * item.quantity)}</strong>
                  </div>
                </div>
              </article>
            ))}
            <form className="coupon-form" onSubmit={applyCoupon}>
              <Tag size={18} /><input aria-label="Coupon code" placeholder="Have a code?" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} />
              <button type="submit">Apply</button>
              {couponMessage && <span className={coupon ? "coupon-success" : "inline-error"} role="status">{couponMessage}</span>}
            </form>
          </div>
          <aside className="order-summary">
            <span className="eyebrow">THE NUMBERS</span><h2>Order summary</h2>
            <div className="summary-row"><span>Subtotal</span><span>{formatPrice(totals.subtotal)}</span></div>
            {totals.discount > 0 && <div className="summary-row summary-discount"><span>Offer ({coupon})</span><span>−{formatPrice(totals.discount)}</span></div>}
            <div className="summary-row"><span>Delivery</span><span>{totals.delivery ? formatPrice(totals.delivery) : "Free"}</span></div>
            <div className="summary-total"><strong>Total</strong><strong>{formatPrice(totals.total)}</strong></div>
            <p className="tax-note">Inclusive of all taxes</p>
            <Link className="button button-dark checkout-button" to="/checkout">Continue to checkout <ArrowRight size={17} /></Link>
            <p className="secure-note">Secure checkout · Easy 7-day returns</p>
          </aside>
        </div>
      ) : (
        <div className="empty-state bag-empty"><span className="empty-icon">♡</span><h2>Your bag is taking a breather.</h2><p>Find something that feels like you and it’ll show up here.</p><Link className="button button-dark" to="/products">Explore the collection</Link></div>
      )}
    </section>
  );
}
