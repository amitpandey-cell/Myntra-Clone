import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../context/useStore";
import { api } from "../lib/api";

const passwordsMatch = (value) => value.length >= 10 && value.length <= 128;

export default function AuthPage({ mode = "login" }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const { setUser, notify } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        if (!passwordsMatch(form.password)) throw new Error("Use a password between 10 and 128 characters.");
        if (form.password !== form.confirmPassword) throw new Error("Your passwords don’t match.");
      }
      if (mode === "reset" && !passwordsMatch(form.password)) {
        throw new Error("Use a password between 10 and 128 characters.");
      }
      const endpoint = mode === "signup" ? "/auth/signup"
        : mode === "forgot" ? "/auth/forgot-password"
          : mode === "reset" ? "/auth/reset-password" : "/auth/login";
      const payload = mode === "signup"
        ? { name: form.name, email: form.email, password: form.password }
        : mode === "forgot" ? { email: form.email }
          : mode === "reset" ? { token: searchParams.get("token"), password: form.password }
            : { email: form.email, password: form.password };
      const result = await api(endpoint, { method: "POST", body: JSON.stringify(payload) });
      if (result.user) {
        setUser(result.user);
        notify(mode === "signup" ? "Welcome to StyleKart." : "Welcome back.");
        navigate(location.state?.from || "/profile", { replace: true });
      } else {
        setMessage(result.message);
        if (mode === "reset") navigate("/login", { replace: true });
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const titles = {
    login: ["Good to see you again.", "Sign in to pick up where you left off."],
    signup: ["Your style story starts here.", "Create an account for a more personal edit."],
    forgot: ["A fresh start.", "We’ll send a reset link if there’s an account for that email."],
    reset: ["Choose a new password.", "Use at least 10 characters to keep your account safer."],
  };

  return (
    <section className="auth-page">
      <div className="auth-aside">
        <span className="eyebrow">STYLEKART MEMBERS</span>
        <h1>Good finds.<br /><em>Good feeling.</em></h1>
        <p>Save your favourites, keep track of your orders and make your next visit feel like yours.</p>
        <div className="auth-aside-note"><span>01</span> A wardrobe that feels like you</div>
      </div>
      <div className="auth-panel">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to the store</Link>
        <span className="eyebrow">{mode === "signup" ? "JOIN THE COMMUNITY" : "YOUR STYLEKART ACCOUNT"}</span>
        <h2>{titles[mode][0]}</h2><p>{titles[mode][1]}</p>
        <form className="form-stack" onSubmit={submit}>
          {mode === "signup" && <label>Full name<input autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}
          {mode !== "reset" && <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>}
          {mode !== "forgot" && <label>{mode === "reset" ? "New password" : "Password"}<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "login" ? 1 : 10} maxLength={128} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>}
          {mode === "signup" && <label>Confirm password<input type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          <button className="button button-dark auth-submit" disabled={busy}>{busy ? "One moment..." : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"} <ArrowRight size={17} /></button>
        </form>
        {mode === "login" && <Link className="text-link auth-secondary-link" to="/forgot-password">Forgot your password?</Link>}
        {mode === "login" && <p className="auth-switch">New to StyleKart? <Link to="/signup">Create an account</Link></p>}
        {mode === "signup" && <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>}
        {mode === "forgot" && <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>}
      </div>
    </section>
  );
}
