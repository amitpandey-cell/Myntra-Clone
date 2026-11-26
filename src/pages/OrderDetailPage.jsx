import { useEffect, useState } from "react";
import { ArrowLeft, Check, Package, RotateCcw, Truck } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useStore } from "../context/useStore";
import { api, formatPrice } from "../lib/api";

const progress = ["processing", "packed", "shipped", "delivered"];

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [checkedAt] = useState(() => Date.now());
  const location = useLocation();
  const { databaseReady, notify } = useStore();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const confirmation = location.pathname.startsWith("/order-confirmation");

  useEffect(() => {
    if (!databaseReady) return;
    api(`/orders/${orderId}`)
      .then(({ order: result }) => setOrder(result))
      .catch((requestError) => setError(requestError.message));
  }, [orderId, databaseReady]);

  async function orderAction(action) {
    setBusy(true);
    setError("");
    try {
      const { order: updated } = await api(`/orders/${order._id}/${action}`, {
        method: "POST",
        body: JSON.stringify(action === "cancel" ? { reason: "Cancelled by customer" } : {}),
      });
      setOrder(updated);
      notify(action === "cancel" ? "Your order has been cancelled." : "Your return request has been sent.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (!databaseReady) return <section className="state-card"><h1>Order details unavailable</h1><p>Connect the API and MongoDB to view order tracking.</p></section>;
  if (error && !order) return <section className="state-card"><span className="eyebrow">ORDER DETAILS</span><h1>{error}</h1><Link className="button button-dark" to="/orders">Back to orders</Link></section>;
  if (!order) return <section className="loading-state"><span className="spinner" />Loading order details...</section>;

  const currentStep = progress.indexOf(order.status);
  const canCancel = order.status === "processing" && order.paymentStatus !== "paid";
  const canReturn = order.status === "delivered" && order.returnStatus === "none"
    && checkedAt - new Date(order.updatedAt).getTime() <= 7 * 24 * 60 * 60 * 1000;

  return (
    <section className="order-detail-page">
      <Link className="back-link" to="/orders"><ArrowLeft size={16} /> Back to orders</Link>
      {confirmation && <div className="confirmation-banner"><span className="confirmation-mark"><Check /></span><div><span className="eyebrow">IT’S OFFICIAL</span><h1>Your order is on its way to becoming a favourite.</h1><p>Order {order.orderNumber} has been placed. We’ll keep you posted right here.</p></div></div>}
      <div className="page-title-row order-title-row"><div><span className="eyebrow">ORDER {order.orderNumber}</span><h1>{confirmation ? "A little something to look forward to." : "Order tracking"}</h1><p className="muted-copy">Placed {new Date(order.createdAt).toLocaleString()}</p></div><span className={`order-status status-${order.status}`}>{order.status}</span></div>
      <div className="order-detail-grid">
        <div className="order-detail-main">
          <section className="account-card tracking-card"><span className="eyebrow">THE JOURNEY</span><h2>{order.status === "cancelled" ? "This order was cancelled" : "Order progress"}</h2>
            {order.status !== "cancelled" ? <div className="tracking-steps">{progress.map((step, index) => <div className={`tracking-step ${index <= currentStep ? "complete" : ""}`} key={step}><span>{index < currentStep ? <Check size={16} /> : index === 2 ? <Truck size={16} /> : index === 3 ? <Package size={16} /> : index + 1}</span><b>{step[0].toUpperCase() + step.slice(1)}</b></div>)}</div> : <p className="muted-copy">{order.cancellationReason || "This order has been cancelled."}</p>}
            {order.trackingNumber && <p className="tracking-number">Tracking reference <b>{order.trackingNumber}</b></p>}
          </section>
          <section className="account-card"><span className="eyebrow">IN YOUR ORDER</span><h2>{order.items.length} {order.items.length === 1 ? "piece" : "pieces"}</h2>
            {order.items.map((item) => <article className="order-item" key={`${item.productId}-${item.size}-${item.color}`}><img src={item.image} alt="" /><div><b>{item.brand}</b><span>{item.name}</span><small>Size {item.size} · {item.color} · Qty {item.quantity}</small></div><strong>{formatPrice(item.unitPrice * item.quantity)}</strong></article>)}
          </section>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="button-row order-actions">
            {canCancel && <button className="button button-outline" disabled={busy} onClick={() => orderAction("cancel")}>Cancel order</button>}
            {canReturn && <button className="button button-outline" disabled={busy} onClick={() => orderAction("return")}><RotateCcw size={16} /> Request a return</button>}
            {order.returnStatus === "requested" && <span className="muted-copy">Return request is awaiting review.</span>}
          </div>
        </div>
        <aside className="order-summary"><span className="eyebrow">DELIVERY & PAYMENT</span><h2>Order summary</h2><div className="summary-row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>{order.discount > 0 && <div className="summary-row summary-discount"><span>Discount</span><span>−{formatPrice(order.discount)}</span></div>}<div className="summary-row"><span>Delivery</span><span>{order.deliveryFee ? formatPrice(order.deliveryFee) : "Free"}</span></div><div className="summary-total"><strong>Total</strong><strong>{formatPrice(order.total)}</strong></div><p className="secure-note">{order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid securely online"}</p><div className="delivery-address"><b>Ship to</b><span>{order.shippingAddress.fullName}</span><span>{order.shippingAddress.line1}, {order.shippingAddress.city}</span><span>{order.shippingAddress.state} {order.shippingAddress.pincode}</span><span>{order.shippingAddress.phone}</span></div></aside>
      </div>
    </section>
  );
}
