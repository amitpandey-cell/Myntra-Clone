import { useEffect, useState } from "react";
import { ArrowRight, PackageCheck, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../context/useStore";
import { api, formatPrice } from "../lib/api";

export default function OrdersPage() {
  const { databaseReady } = useStore();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(databaseReady);

  useEffect(() => {
    if (!databaseReady) return;
    api("/orders")
      .then(({ orders: result }) => setOrders(result))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [databaseReady]);

  if (loading) return <section className="loading-state"><span className="spinner" />Finding your orders...</section>;
  return (
    <section className="shopping-page">
      <div className="page-title-row"><div><span className="eyebrow">THE JOURNEY AFTER CHECKOUT</span><h1>Your orders</h1></div></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {orders.length ? <div className="orders-list">
        {orders.map((order) => <Link className="order-list-card" key={order._id} to={`/orders/${order._id}`}>
          <div className="order-list-icon"><PackageCheck /></div>
          <div className="order-list-main"><span className="eyebrow">ORDER {order.orderNumber}</span><b>{order.items.length} {order.items.length === 1 ? "piece" : "pieces"}</b><span>{new Date(order.createdAt).toLocaleDateString()}</span></div>
          <span className={`order-status status-${order.status}`}>{order.status}</span><strong>{formatPrice(order.total)}</strong><ArrowRight size={17} />
        </Link>)}
      </div> : <div className="empty-state"><ShoppingBag className="empty-icon" /><h2>Your next favourite is waiting.</h2><p>Once you place an order, we’ll keep all the details right here.</p><Link className="button button-dark" to="/products">Browse the collection</Link></div>}
    </section>
  );
}
