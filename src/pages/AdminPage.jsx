import { useCallback, useEffect, useState } from "react";
import { BarChart3, Boxes, ClipboardList, PackagePlus, Pencil, Trash2, Users } from "lucide-react";
import { api, formatPrice } from "../lib/api";
import { useStore } from "../context/useStore";

const emptyProduct = {
  productId: "", brand: "", name: "", category: "Women", subcategory: "", price: "", oldPrice: "",
  popularity: 50, images: "", description: "", sizes: "One Size", colors: "Default",
  stock: 0, featured: false, bestseller: false, rating: 0, reviewCount: 0,
};

const adminTabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "products", label: "Products & categories", icon: Boxes },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "customers", label: "Customers", icon: Users },
];

export default function AdminPage() {
  const { refreshCatalog, notify } = useStore();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productForm, setProductForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summary, productData, orderData, userData] = await Promise.all([
        api("/admin/stats"),
        api("/admin/products"),
        api("/admin/orders"),
        api("/admin/users"),
      ]);
      setStats(summary);
      setProducts(productData.products);
      setOrders(orderData.orders);
      setUsers(userData.users);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  function editProduct(product) {
    setProductForm({
      ...product,
      images: product.images.join(", "),
      sizes: product.sizes.join(", "),
      colors: product.colors.join(", "),
      editing: true,
    });
  }

  async function saveProduct(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const editing = Boolean(productForm.editing);
    const form = { ...productForm };
    delete form.editing;
    delete form._id;
    delete form.id;
    const payload = {
      ...form,
      price: Number(form.price),
      oldPrice: Number(form.oldPrice),
      stock: Number(form.stock),
      popularity: Number(form.popularity),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
      images: form.images.split(",").map((image) => image.trim()).filter(Boolean),
      sizes: form.sizes.split(",").map((item) => item.trim()).filter(Boolean),
      colors: form.colors.split(",").map((item) => item.trim()).filter(Boolean),
      featured: Boolean(form.featured),
      bestseller: Boolean(form.bestseller),
    };
    try {
      await api(`/admin/products${editing ? `/${encodeURIComponent(form.productId)}` : ""}`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setProductForm(null);
      await Promise.all([loadData(), refreshCatalog()]);
      notify(editing ? "Product updated." : "Product added to the catalog.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct(product) {
    if (!window.confirm(`Remove ${product.name} from the catalog?`)) return;
    try {
      await api(`/admin/products/${encodeURIComponent(product.productId)}`, { method: "DELETE" });
      await Promise.all([loadData(), refreshCatalog()]);
      notify("Product removed.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function updateUserRole(user, role) {
    try {
      await api(`/admin/users/${user._id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
      await loadData();
      notify("Customer access updated.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-heading"><div><span className="eyebrow">STYLEKART CONTROL ROOM</span><h1>A better view of your store.</h1><p>Products, people and orders — all in one place.</p></div><span className="admin-badge">ADMIN ACCESS</span></div>
      <div className="admin-shell">
        <nav className="admin-sidebar" aria-label="Admin sections">{adminTabs.map(({ id, label, icon: Icon }) => <button className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id)}><Icon size={17} />{label}</button>)}</nav>
        <div className="admin-content">
          {error && <p className="form-error" role="alert">{error}</p>}
          {loading ? <div className="loading-state"><span className="spinner" />Loading store data...</div> : (
            <>
              {tab === "overview" && <Overview stats={stats} orders={orders.slice(0, 5)} setTab={setTab} />}
              {tab === "products" && <ProductManagement products={products} onEdit={editProduct} onAdd={() => setProductForm({ ...emptyProduct })} onRemove={removeProduct} />}
              {tab === "orders" && <OrderManagement orders={orders} onUpdated={loadData} notify={notify} />}
              {tab === "customers" && <CustomerManagement users={users} onRoleChange={updateUserRole} />}
            </>
          )}
        </div>
      </div>
      {productForm && <ProductEditor product={productForm} setProduct={setProductForm} onSubmit={saveProduct} onClose={() => setProductForm(null)} busy={busy} />}
    </section>
  );
}

function Overview({ stats, orders, setTab }) {
  const cards = [
    { label: "Total customers", value: stats.users, icon: Users },
    { label: "Products in store", value: stats.products, icon: Boxes },
    { label: "Orders to date", value: stats.orders, icon: ClipboardList },
    { label: "Recognised revenue", value: formatPrice(stats.revenue), icon: BarChart3 },
  ];
  return <div className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">A QUICK PULSE</span><h2>Store overview</h2></div></div><div className="stat-grid">{cards.map(({ label, value, icon: Icon }) => <article className="stat-card" key={label}><span><Icon size={19} /></span><small>{label}</small><strong>{value}</strong></article>)}</div><div className="admin-subheading"><h3>Recent orders</h3><button className="text-button" onClick={() => setTab("orders")}>All orders →</button></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td>{order.orderNumber}</td><td>{order.shippingAddress?.fullName}</td><td><span className={`order-status status-${order.status}`}>{order.status}</span></td><td>{formatPrice(order.total)}</td></tr>)}{!orders.length && <tr><td colSpan="4">No orders yet.</td></tr>}</tbody></table></div></div>;
}

function ProductManagement({ products, onEdit, onAdd, onRemove }) {
  return <div className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">THE CATALOG</span><h2>Products & categories</h2></div><button className="button button-dark" onClick={onAdd}><PackagePlus size={16} /> Add product</button></div><p className="muted-copy">Edit product details, categories, sizes and available inventory.</p><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Department</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><b>{product.brand}</b><small>{product.name}</small></td><td>{product.category}<small>{product.subcategory}</small></td><td>{formatPrice(product.price)}</td><td><span className={product.stock < 5 ? "low-stock" : ""}>{product.stock}</span></td><td><div className="table-actions"><button title="Edit product" aria-label={`Edit ${product.name}`} onClick={() => onEdit(product)}><Pencil size={15} /></button><button title="Remove product" aria-label={`Remove ${product.name}`} onClick={() => onRemove(product)}><Trash2 size={15} /></button></div></td></tr>)}{!products.length && <tr><td colSpan="5">No catalog products found. Run <code>npm run seed</code> to load the sample catalog.</td></tr>}</tbody></table></div></div>;
}

function ProductEditor({ product, setProduct, onSubmit, onClose, busy }) {
  const fields = [
    ["productId", "Product ID"], ["brand", "Brand"], ["name", "Product name"], ["category", "Department"],
    ["subcategory", "Category"], ["price", "Selling price"], ["oldPrice", "Original price"], ["stock", "Inventory"],
    ["sizes", "Sizes (comma separated)"], ["colors", "Colours (comma separated)"],
    ["images", "Image URLs (comma separated)"], ["description", "Description"],
  ];
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="product-editor form-stack" role="dialog" aria-modal="true" aria-labelledby="product-editor-title" onSubmit={onSubmit}>
    <div className="product-editor-heading"><div><span className="eyebrow">{product.editing ? "CATALOG UPDATE" : "NEW TO THE COLLECTION"}</span><h2 id="product-editor-title">{product.editing ? "Edit product" : "Add a product"}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close editor">×</button></div>
    <div className="form-grid">{fields.map(([name, label]) => <label className={["images", "description"].includes(name) ? "form-span-2" : ""} key={name}>{label}{name === "category" ? <select required value={product[name]} onChange={(event) => setProduct({ ...product, [name]: event.target.value })}>{["Men", "Women", "Kids", "Beauty", "Home"].map((item) => <option key={item}>{item}</option>)}</select> : name === "description" ? <textarea required rows="3" maxLength="2000" value={product[name]} onChange={(event) => setProduct({ ...product, [name]: event.target.value })} /> : <input required readOnly={name === "productId" && product.editing} type={["price", "oldPrice", "stock"].includes(name) ? "number" : "text"} min={["price", "oldPrice", "stock"].includes(name) ? "0" : undefined} value={product[name] ?? ""} onChange={(event) => setProduct({ ...product, [name]: event.target.value })} />}</label>)}</div>
    <div className="checkbox-row"><label><input type="checkbox" checked={Boolean(product.featured)} onChange={(event) => setProduct({ ...product, featured: event.target.checked })} /> Featured</label><label><input type="checkbox" checked={Boolean(product.bestseller)} onChange={(event) => setProduct({ ...product, bestseller: event.target.checked })} /> Bestseller</label></div>
    <div className="button-row"><button className="button button-dark" disabled={busy}>{busy ? "Saving..." : product.editing ? "Save changes" : "Add product"}</button><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button></div>
  </form></div>;
}

function OrderManagement({ orders, onUpdated, notify }) {
  return <div className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">FULFILMENT</span><h2>Manage orders</h2></div><span>{orders.length} total</span></div>{orders.length ? <div className="admin-order-list">{orders.map((order) => <AdminOrderRow key={order._id} order={order} onUpdated={onUpdated} notify={notify} />)}</div> : <div className="empty-admin">No customer orders to manage yet.</div>}</div>;
}

function AdminOrderRow({ order, onUpdated, notify }) {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [returnStatus, setReturnStatus] = useState(order.returnStatus);
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await api(`/admin/orders/${order._id}`, { method: "PATCH", body: JSON.stringify({ status, trackingNumber, returnStatus }) });
      await onUpdated();
      notify("Order updated.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }
  return <article className="admin-order-row"><div className="admin-order-summary"><b>{order.orderNumber}</b><span>{order.shippingAddress?.fullName} · {formatPrice(order.total)}</span><small>{new Date(order.createdAt).toLocaleDateString()} · {order.paymentMethod.toUpperCase()}</small></div><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{["processing", "packed", "shipped", "delivered", "cancelled"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Tracking reference<input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Optional" /></label>{order.returnStatus === "requested" && <label>Return request<select value={returnStatus} onChange={(event) => setReturnStatus(event.target.value)}><option value="requested">Requested</option><option value="approved">Approve</option><option value="rejected">Decline</option></select></label>}<button className="button button-outline" disabled={busy} onClick={save}>{busy ? "Saving..." : "Update"}</button></article>;
}

function CustomerManagement({ users, onRoleChange }) {
  return <div className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">THE COMMUNITY</span><h2>Manage customers</h2></div><span>{users.length} accounts</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Email</th><th>Joined</th><th>Access</th></tr></thead><tbody>{users.map((user) => <tr key={user._id}><td>{user.name}</td><td>{user.email}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td><select value={user.role} onChange={(event) => onRoleChange(user, event.target.value)}><option value="customer">Customer</option><option value="admin">Admin</option></select></td></tr>)}{!users.length && <tr><td colSpan="4">No customer accounts yet.</td></tr>}</tbody></table></div></div>;
}
