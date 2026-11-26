import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { fetchDummyProducts, products } from "../data/products";
import { StoreContext } from "./storeContext";

function readStoredValue(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Unable to read ${key} from local storage.`, error);
    return fallback;
  }
}

function readCart() {
  const stored = readStoredValue("stylekart-cart", []);
  if (!Array.isArray(stored)) return [];
  return stored.flatMap((item) => {
    if (item?.productId && item?.product && Number.isInteger(item.quantity)) {
      return [{ ...item, color: item.color || item.product.colors?.[0] || "Default" }];
    }
    const product = products.find((candidate) => candidate.brand.toLowerCase() === String(item?.brand || "").toLowerCase())
      || products.find((candidate) => candidate.id === item?.id)
      || products[Number(item?.id) - 1];
    return product ? [{ productId: product.id, size: product.sizes[0], color: product.colors[0], quantity: 1, product }] : [];
  });
}

function readWishlist() {
  const stored = readStoredValue("stylekart-wishlist", []);
  if (!Array.isArray(stored)) return [];
  return stored.flatMap((id) => typeof id === "string"
    ? [id]
    : products[Number(id) - 1] ? [products[Number(id) - 1].id] : []);
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(readCart);
  const [wishlist, setWishlist] = useState(readWishlist);
  const [user, setUser] = useState(null);
  const [apiReady, setApiReady] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [paymentsReady, setPaymentsReady] = useState(false);
  const [catalog, setCatalog] = useState(products);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, tone = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    localStorage.setItem("stylekart-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("stylekart-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    let active = true;
    let preferDatabaseCatalog = false;

    fetchDummyProducts()
      .then((items) => {
        if (!active || preferDatabaseCatalog) return;
        if (!items.length) throw new Error("DummyJSON returned no products with images.");
        setCatalog(items);
        setCatalogError("");
        setCatalogLoading(false);
      })
      .catch((error) => {
        if (!active || preferDatabaseCatalog) return;
        console.error("Could not load the DummyJSON catalog.", error);
        setCatalogError("The live product catalog is unavailable. Showing the preview catalog instead.");
        setCatalogLoading(false);
      });

    api("/health")
      .then((health) => {
        if (!active) return;
        setApiReady(true);
        setDatabaseReady(Boolean(health.database));
        setPaymentsReady(Boolean(health.paymentsConfigured));
        const tasks = [
          api("/auth/me")
          .then(({ user: currentUser }) => active && setUser(currentUser))
          .catch(() => active && setUser(null)),
        ];
        if (health.database) {
          preferDatabaseCatalog = true;
          tasks.push(api("/products?limit=60")
            .then(({ items }) => {
              if (!active) return;
              if (!items.length) throw new Error("The database catalog is empty.");
              setCatalog(items.map((item) => ({ ...item, id: item.productId })));
              setCatalogError("");
              setCatalogLoading(false);
            })
            .catch((error) => {
              if (!active) return;
              console.error("Could not load catalog data.", error);
              setCatalogError("The product catalog could not be loaded.");
              setCatalogLoading(false);
            }));
        }
        return Promise.all(tasks);
      })
      .catch(() => active && setApiReady(false));
    return () => {
      active = false;
    };
  }, []);

  const refreshCatalog = useCallback(async () => {
    const { items } = await api("/products?limit=60");
    setCatalog(items.map((item) => ({ ...item, id: item.productId })));
  }, []);

  const addToCart = useCallback((product, size = product.sizes?.[0] || "One Size", quantity = 1, color = product.colors?.[0] || "Default") => {
    setCart((current) => {
      const line = current.find((item) => item.productId === product.id && item.size === size && item.color === color);
      if (line) {
        return current.map((item) => item === line
          ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
          : item);
      }
      return [...current, { productId: product.id, size, color, quantity, product }];
    });
    notify("Added to your bag.");
  }, [notify]);

  const updateQuantity = useCallback((productId, size, color, quantity) => {
    setCart((current) => quantity < 1
      ? current.filter((item) => !(item.productId === productId && item.size === size && item.color === color))
      : current.map((item) => item.productId === productId && item.size === size && item.color === color
        ? { ...item, quantity: Math.min(quantity, item.product.stock) }
        : item));
  }, []);

  const toggleWishlist = useCallback((productId) => {
    setWishlist((current) => {
      const exists = current.includes(productId);
      notify(exists ? "Removed from your wishlist." : "Saved to your wishlist.");
      return exists ? current.filter((id) => id !== productId) : [...current, productId];
    });
  }, [notify]);

  const value = useMemo(() => ({
    cart,
    wishlist,
    user,
    setUser,
    apiReady,
    databaseReady,
    paymentsReady,
    products: catalog,
    catalogLoading,
    catalogError,
    refreshCatalog,
    toasts,
    notify,
    addToCart,
    updateQuantity,
    toggleWishlist,
    clearCart: () => setCart([]),
  }), [cart, wishlist, user, apiReady, databaseReady, paymentsReady, catalog, catalogLoading, catalogError, refreshCatalog, toasts, notify, addToCart, updateQuantity, toggleWishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

