import { useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { api } from "../lib/api";
import { useStore } from "../context/useStore";

const categories = [
  { name: "Women", sub: "The new mood", image: "photo-1483985988355-763728e1935b" },
  { name: "Men", sub: "Everyday icons", image: "photo-1515886657613-9f3515b0c78f" },
  { name: "Kids", sub: "Little big moments", image: "photo-1503919005314-30d93d07d823" },
  { name: "Beauty", sub: "Your daily ritual", image: "photo-1522335789203-aabd1fc54bc9" },
];

const imageUrl = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;

export default function HomePage() {
  const { products } = useStore();
  const bestsellers = products.filter((product) => product.bestseller).slice(0, 4);
  const newArrivals = products.filter((product) => product.featured).slice(0, 4);

  return (
    <>
      <section className="hero-section">
        <img className="hero-image" src={imageUrl("photo-1483985988355-763728e1935b")} alt="Friends exploring a fashion collection" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> THE NEW-SEASON EDIT</span>
          <h1>Find your<br /><em>everyday</em> kind of style.</h1>
          <p>Fresh fits, feel-good finds and the pieces you’ll keep reaching for.</p>
          <Link className="button button-light" to="/products">Shop the edit <ArrowRight size={17} /></Link>
        </div>
        <div className="hero-side-note">SPRING / SUMMER — 2026</div>
        <Link className="hero-scroll" to="/products"><ArrowDownRight size={18} /> Scroll to discover</Link>
      </section>

      <section className="section-block category-section">
        <div className="section-heading">
          <div><span className="eyebrow">A LITTLE SOMETHING FOR EVERYONE</span><h2>Shop by mood</h2></div>
          <Link className="text-link" to="/products">View all departments <ArrowUpRight size={16} /></Link>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <Link className={`category-tile category-tile-${index + 1}`} to={`/products?category=${category.name}`} key={category.name}>
              <img src={imageUrl(category.image)} alt="" loading="lazy" />
              <div><span>{category.sub}</span><h3>{category.name}</h3><span className="category-arrow"><ArrowRight size={17} /></span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block product-section">
        <div className="section-heading">
          <div><span className="eyebrow">THE ONES EVERYONE LOVES</span><h2>Best sellers</h2></div>
          <Link className="text-link" to="/products?sort=popular">Shop best sellers <ArrowUpRight size={16} /></Link>
        </div>
        <div className="product-grid">
          {bestsellers.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="story-banner">
        <img src={imageUrl("photo-1529139574466-a303027c1d8b")} alt="A new-season outfit styled for the city" loading="lazy" />
        <div className="story-banner-copy">
          <span className="eyebrow">A FRESH PERSPECTIVE</span>
          <h2>Good things<br />are in season.</h2>
          <p>Easy layers. Better basics. A little more you in every outfit.</p>
          <Link className="button button-dark" to="/products">Meet your next favourite <ArrowRight size={17} /></Link>
        </div>
      </section>

      <section className="section-block product-section arrivals-section">
        <div className="section-heading">
          <div><span className="eyebrow">JUST LANDED</span><h2>New arrivals</h2></div>
          <Link className="text-link" to="/products?sort=new">See what’s new <ArrowUpRight size={16} /></Link>
        </div>
        <div className="product-grid">
          {newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="brand-strip">
        <span className="eyebrow">GOOD COMPANY, GOOD STYLE</span>
        <div>{["ROADSTER", "BIBA", "LAVIE", "HRX", "LEVI’S"].map((brand) => <span key={brand}>{brand}</span>)}</div>
      </section>

      <Newsletter />
    </>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { notify } = useStore();

  async function subscribe(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api("/newsletter", { method: "POST", body: JSON.stringify({ email }) });
      setMessage(result.message);
      setEmail("");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="newsletter-section">
      <div><span className="eyebrow">A NOTE FROM US, ONCE IN A WHILE</span><h2>Good style in your inbox.</h2><p>Get the latest edits, new arrivals and little surprises.</p></div>
      <form className="newsletter-form" onSubmit={subscribe}>
        <label className="sr-only" htmlFor="newsletter-email">Email address</label>
        <input id="newsletter-email" type="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Joining..." : "Keep me posted"} <ArrowRight size={16} /></button>
        {message && <span className="newsletter-message" role="status">{message}</span>}
      </form>
    </section>
  );
}
