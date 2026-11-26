import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Heart, Menu, Search, ShoppingBag, UserRound, X, LogOut,
} from "lucide-react";
import { useStore } from "../context/useStore";
import { api } from "../lib/api";

const departments = ["Men", "Women", "Kids", "Beauty", "Home"];

function StoreHeader() {
  const { cart, wishlist, user, setUser, apiReady, databaseReady, notify } = useStore();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  function search(event) {
    event.preventDefault();
    navigate(`/products${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
    setMenuOpen(false);
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      notify("You have signed out.");
      navigate("/");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  return (
    <>
      <div className="announcement">STYLE THAT MOVES WITH YOU <span>·</span> FREE DELIVERY OVER ₹999</div>
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="StyleKart home">STYLE<span>KART</span></Link>
        <button className="icon-button mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={`department-nav ${menuOpen ? "is-open" : ""}`} aria-label="Shop departments">
          {departments.map((department) => (
            <NavLink key={department} to={`/products?category=${department}`} onClick={() => setMenuOpen(false)}>
              {department}
            </NavLink>
          ))}
        </nav>
        <form className="header-search" onSubmit={search} role="search">
          <Search size={18} aria-hidden="true" />
          <input aria-label="Search products and brands" placeholder="Search products, brands..." value={query} onChange={(event) => setQuery(event.target.value)} />
          {query && <button className="search-clear" type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={15} /></button>}
        </form>
        <div className="header-actions">
          <Link className="header-action" to={user ? "/profile" : "/login"} aria-label={user ? "Your profile" : "Sign in"}>
            <UserRound /><span>{user ? user.name.split(" ")[0] : "Profile"}</span>
          </Link>
          {user?.role === "admin" && <Link className="header-action admin-shortcut" to="/admin">Admin</Link>}
          {user && <button className="header-action logout-action" onClick={logout} aria-label="Sign out"><LogOut /><span>Sign out</span></button>}
          <Link className="header-action" to="/wishlist" aria-label={`Wishlist, ${wishlist.length} items`}>
            <Heart /><span>Wishlist</span>{wishlist.length > 0 && <b className="count-badge">{wishlist.length}</b>}
          </Link>
          <Link className="header-action bag-action" to="/cart" aria-label={`Shopping bag, ${cartCount} items`}>
            <ShoppingBag /><span>Bag</span>{cartCount > 0 && <b className="count-badge">{cartCount}</b>}
          </Link>
        </div>
      </header>
      {(!apiReady || !databaseReady) && (
        <div className="connection-notice" role="status">
          Preview catalog is ready. Start the API and configure MongoDB to enable accounts, orders, reviews and admin tools.
        </div>
      )}
    </>
  );
}

function StoreFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="wordmark footer-wordmark" to="/">STYLE<span>KART</span></Link>
          <p>Everyday style, thoughtfully found.</p>
        </div>
        <div><h3>Shop</h3>{departments.map((item) => <Link key={item} to={`/products?category=${item}`}>{item}</Link>)}</div>
        <div><h3>Help</h3><Link to="/profile">Your account</Link><Link to="/orders">Orders & returns</Link><Link to="/cart">Shipping & checkout</Link></div>
        <div><h3>Stay in style</h3><p>New-season edits, thoughtful picks and members-only offers.</p><Link className="footer-cta" to="/products">Explore the collection <span>↗</span></Link></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} StyleKart. All rights reserved.</span><span>Made for your everyday.</span></div>
    </footer>
  );
}

function ToastViewport() {
  const { toasts } = useStore();
  return (
    <div className="toast-viewport" aria-live="polite">
      {toasts.map((toast) => <div className={`toast toast-${toast.tone}`} key={toast.id}>{toast.message}</div>)}
    </div>
  );
}

export default function StoreLayout() {
  return (
    <>
      <StoreHeader />
      <main className="page-main"><Outlet /></main>
      <StoreFooter />
      <ToastViewport />
    </>
  );
}
