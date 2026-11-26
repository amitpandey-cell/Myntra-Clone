import { useEffect } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import StoreLayout from "./components/StoreLayout";
import RequireAuth from "./components/RequireAuth";
import { StoreProvider } from "./context/StoreContext.jsx";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import AdminPage from "./pages/AdminPage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function NotFoundPage() {
  return <section className="state-card"><span className="eyebrow">404 — NOT FOUND</span><h1>This page took a different turn.</h1><p>Let’s get you back to something good.</p><Link className="button button-dark" to="/">Back to StyleKart</Link></section>;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<StoreLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<CatalogPage />} />
            <Route path="product/:productId" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="signup" element={<AuthPage mode="signup" />} />
            <Route path="forgot-password" element={<AuthPage mode="forgot" />} />
            <Route path="reset-password" element={<AuthPage mode="reset" />} />
            <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
            <Route path="orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
            <Route path="orders/:orderId" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
            <Route path="order-confirmation/:orderId" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
            <Route path="admin" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StoreProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
