import { useState } from "react";
import { ArrowLeft, ArrowRight, CreditCard, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/useStore";
import { api, formatPrice } from "../lib/api";
import { calculateTotals } from "../lib/pricing";

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { cart, user, paymentsReady, clearCart } = useStore();
  const navigate = useNavigate();
  const savedCoupon = localStorage.getItem("stylekart-coupon") || "";
  const [coupon] = useState(savedCoupon);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState(user.addresses?.[0] || {
    label: "Home", fullName: user.name, phone: "", line1: "", line2: "", city: "", state: "", pincode: "",
  });
  const totals = calculateTotals(cart, coupon);

  function updateAddress(event) {
    setAddress({ ...address, [event.target.name]: event.target.value });
  }

  async function completeOrder(event) {
    event.preventDefault();
    if (!cart.length) return navigate("/cart");
    setBusy(true);
    setError("");
    const payload = {
      items: cart.map(({ productId, size, color, quantity }) => ({ productId, size, color, quantity })),
      shippingAddress: address,
      coupon,
    };
    try {
      if (paymentMethod === "razorpay") {
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error("Secure payment checkout could not be loaded. Please try again or choose Cash on Delivery.");
        const gatewayOrder = await api("/orders/razorpay/create", { method: "POST", body: JSON.stringify(payload) });
        const checkout = new window.Razorpay({
          key: gatewayOrder.keyId,
          amount: gatewayOrder.amount,
          currency: gatewayOrder.currency,
          name: "StyleKart",
          description: "Fashion order",
          order_id: gatewayOrder.gatewayOrderId,
          prefill: { name: user.name, email: user.email, contact: address.phone },
          theme: { color: "#e75b78" },
          handler: async (response) => {
            try {
              const { order } = await api("/orders/razorpay/verify", {
                method: "POST",
                body: JSON.stringify({
                  ...payload,
                  gatewayOrderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              });
              clearCart();
              localStorage.removeItem("stylekart-coupon");
              navigate(`/order-confirmation/${order._id}`);
            } catch (verificationError) {
              setError(verificationError.message);
              setBusy(false);
            }
          },
          modal: { ondismiss: () => setBusy(false) },
        });
        checkout.open();
        return;
      }
      const { order } = await api("/orders", { method: "POST", body: JSON.stringify(payload) });
      clearCart();
      localStorage.removeItem("stylekart-coupon");
      navigate(`/order-confirmation/${order._id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (!cart.length) return <section className="empty-state"><h1>Your bag is empty.</h1><p>Add something you love before checking out.</p><Link className="button button-dark" to="/products">Browse the collection</Link></section>;

  return (
    <section className="checkout-page">
      <Link className="back-link" to="/cart"><ArrowLeft size={16} /> Back to your bag</Link>
      <div className="page-title-row"><div><span className="eyebrow">JUST A FEW MORE DETAILS</span><h1>Make it yours.</h1></div><span className="secure-checkout"><ShieldCheck size={17} /> Secure checkout</span></div>
      <form className="checkout-layout" onSubmit={completeOrder}>
        <div className="checkout-main">
          <section className="checkout-card">
            <span className="step-number">01</span><div className="checkout-card-heading"><h2>Where should we send it?</h2><p>Add a delivery address for your order.</p></div>
            <div className="form-grid">
              <label>Full name<input name="fullName" autoComplete="name" required value={address.fullName || ""} onChange={updateAddress} /></label>
              <label>Phone number<input name="phone" type="tel" inputMode="numeric" autoComplete="tel" required maxLength={10} value={address.phone || ""} onChange={(event) => setAddress({ ...address, phone: event.target.value.replace(/\D/g, "") })} /></label>
              <label className="form-span-2">Address line 1<input name="line1" autoComplete="address-line1" required value={address.line1 || ""} onChange={updateAddress} /></label>
              <label className="form-span-2">Address line 2 <span className="optional-note">Optional</span><input name="line2" autoComplete="address-line2" value={address.line2 || ""} onChange={updateAddress} /></label>
              <label>City<input name="city" autoComplete="address-level2" required value={address.city || ""} onChange={updateAddress} /></label>
              <label>State<input name="state" autoComplete="address-level1" required value={address.state || ""} onChange={updateAddress} /></label>
              <label>Pincode<input name="pincode" inputMode="numeric" autoComplete="postal-code" required maxLength={6} value={address.pincode || ""} onChange={(event) => setAddress({ ...address, pincode: event.target.value.replace(/\D/g, "") })} /></label>
            </div>
          </section>
          <section className="checkout-card">
            <span className="step-number">02</span><div className="checkout-card-heading"><h2>How would you like to pay?</h2><p>Choose a payment option for this order.</p></div>
            <label className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}><input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} /><span><b>Cash on Delivery</b><small>Pay when your order arrives.</small></span><span className="payment-symbol">₹</span></label>
            {paymentsReady && <label className={`payment-option ${paymentMethod === "razorpay" ? "selected" : ""}`}><input type="radio" name="payment" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} /><span><b>Pay online with Razorpay</b><small>Secure test-mode checkout.</small></span><CreditCard size={19} /></label>}
            {!paymentsReady && <p className="muted-copy payment-unavailable">Online payment will appear when Razorpay test credentials are configured.</p>}
          </section>
        </div>
        <aside className="order-summary checkout-summary">
          <span className="eyebrow">A QUICK RECAP</span><h2>Your order</h2>
          <div className="checkout-items">{cart.map((item) => <div className="checkout-item" key={`${item.productId}-${item.size}-${item.color}`}><img src={item.product.images[0]} alt="" /><span><b>{item.product.name}</b><small>Size {item.size} · {item.color} · Qty {item.quantity}</small></span><strong>{formatPrice(item.product.price * item.quantity)}</strong></div>)}</div>
          <div className="summary-row"><span>Subtotal</span><span>{formatPrice(totals.subtotal)}</span></div>
          {totals.discount > 0 && <div className="summary-row summary-discount"><span>Offer</span><span>−{formatPrice(totals.discount)}</span></div>}
          <div className="summary-row"><span>Delivery</span><span>{totals.delivery ? formatPrice(totals.delivery) : "Free"}</span></div>
          <div className="summary-total"><strong>Total</strong><strong>{formatPrice(totals.total)}</strong></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark checkout-button" disabled={busy}>{busy ? "Securing your order..." : paymentMethod === "cod" ? "Place order" : "Continue to payment"} <ArrowRight size={17} /></button>
          <p className="secure-note">You’ll see your order confirmation once the order is placed.</p>
        </aside>
      </form>
    </section>
  );
}
