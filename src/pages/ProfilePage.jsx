import { useState } from "react";
import { ArrowRight, MapPin, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../context/useStore";
import { api } from "../lib/api";

const blankAddress = { label: "Home", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

export default function ProfilePage() {
  const { user, setUser, notify } = useStore();
  const [name, setName] = useState(user.name);
  const [addresses, setAddresses] = useState(user.addresses || []);
  const [draft, setDraft] = useState(blankAddress);
  const [editingAddress, setEditingAddress] = useState(false);
  const [busy, setBusy] = useState(false);

  async function saveName(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { user: updated } = await api("/auth/profile", { method: "PUT", body: JSON.stringify({ name }) });
      setUser(updated);
      notify("Your profile has been updated.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveAddresses(nextAddresses) {
    setBusy(true);
    try {
      const { user: updated } = await api("/auth/addresses", { method: "PUT", body: JSON.stringify({ addresses: nextAddresses }) });
      setUser(updated);
      setAddresses(updated.addresses);
      setEditingAddress(false);
      setDraft(blankAddress);
      notify("Your address book has been updated.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function addAddress(event) {
    event.preventDefault();
    if (!/^[0-9]{10}$/.test(draft.phone) || !/^[0-9]{6}$/.test(draft.pincode)) {
      notify("Enter a 10-digit phone number and 6-digit pincode.", "error");
      return;
    }
    saveAddresses([...addresses, draft]);
  }

  return (
    <section className="account-page">
      <div className="page-title-row"><div><span className="eyebrow">YOUR STYLEKART SPACE</span><h1>Hi, {user.name.split(" ")[0]}.</h1><p className="muted-copy">{user.email}</p></div><Link className="text-link" to="/orders">View your orders <ArrowRight size={16} /></Link></div>
      <div className="account-grid">
        <form className="account-card form-stack" onSubmit={saveName}><span className="eyebrow">YOUR DETAILS</span><h2>Profile</h2><label>Full name<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label><label>Email address<input value={user.email} disabled /></label><button className="button button-dark" disabled={busy}>Save changes</button></form>
        <div className="account-card">
          <div className="account-card-heading"><div><span className="eyebrow">DELIVERY MADE EASY</span><h2>Saved addresses</h2></div><MapPin size={20} /></div>
          {addresses.map((address) => (
            <article className="address-card" key={address._id || `${address.line1}-${address.pincode}`}>
              <span className="address-label">{address.label || "Home"}</span><b>{address.fullName}</b><span>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</span><span>{address.city}, {address.state} {address.pincode}</span><span>{address.phone}</span>
              <button className="remove-line" onClick={() => saveAddresses(addresses.filter((item) => item !== address))}><Trash2 size={14} /> Remove</button>
            </article>
          ))}
          {!addresses.length && <p className="muted-copy">Your saved addresses will live here.</p>}
          {!editingAddress ? <button className="button button-outline" onClick={() => setEditingAddress(true)}><Plus size={16} /> Add a new address</button> : (
            <form className="form-stack address-form" onSubmit={addAddress}>
              <div className="form-grid">
                <label>Label<input value={draft.label} maxLength={40} onChange={(event) => setDraft({ ...draft, label: event.target.value })} /></label>
                <label>Full name<input required value={draft.fullName} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} /></label>
                <label>Phone<input required inputMode="numeric" maxLength={10} value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value.replace(/\D/g, "") })} /></label>
                <label>Address line 1<input required value={draft.line1} onChange={(event) => setDraft({ ...draft, line1: event.target.value })} /></label>
                <label>Address line 2<input value={draft.line2} onChange={(event) => setDraft({ ...draft, line2: event.target.value })} /></label>
                <label>City<input required value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></label>
                <label>State<input required value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })} /></label>
                <label>Pincode<input required inputMode="numeric" maxLength={6} value={draft.pincode} onChange={(event) => setDraft({ ...draft, pincode: event.target.value.replace(/\D/g, "") })} /></label>
              </div>
              <div className="button-row"><button className="button button-dark" disabled={busy}>Save address</button><button type="button" className="button button-quiet" onClick={() => setEditingAddress(false)}>Cancel</button></div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
