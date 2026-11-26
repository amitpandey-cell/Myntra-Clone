import { Navigate, useLocation } from "react-router-dom";
import { useStore } from "../context/useStore";

export default function RequireAuth({ admin = false, children }) {
  const { user, databaseReady } = useStore();
  const location = useLocation();

  if (!databaseReady) return <section className="state-card"><h1>Account services unavailable</h1><p>Start the API and configure MongoDB to sign in and continue.</p></section>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
