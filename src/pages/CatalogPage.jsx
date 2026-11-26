import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useStore } from "../context/useStore";

const departments = ["Men", "Women", "Kids", "Beauty", "Home"];

export default function CatalogPage() {
  const { products, catalogLoading, catalogError } = useStore();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = params.get("q") || "";
  const category = params.get("category") || "";
  const subcategory = params.get("subcategory") || "";
  const brand = params.get("brand") || "";
  const size = params.get("size") || "";
  const sort = params.get("sort") || "popular";
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";
  const minDiscount = params.get("minDiscount") || "";
  const setFilter = (key, value) => {
    const updated = new URLSearchParams(params);
    if (value) updated.set(key, value);
    else updated.delete(key);
    if (key === "category") updated.delete("subcategory");
    setParams(updated, { replace: true });
  };

  const brands = [...new Set(products.map((product) => product.brand))].sort();
  const subcategories = [...new Set(products
    .filter((product) => !category || product.category === category)
    .map((product) => product.subcategory))].sort();
  const sizes = [...new Set(products.flatMap((product) => product.sizes))].sort();
  const filtered = useMemo(() => products
    .filter((product) => !query || `${product.name} ${product.brand} ${product.subcategory}`.toLowerCase().includes(query.toLowerCase()))
    .filter((product) => !category || product.category === category)
    .filter((product) => !subcategory || product.subcategory === subcategory)
    .filter((product) => !brand || product.brand === brand)
    .filter((product) => !size || product.sizes.includes(size))
    .filter((product) => !minPrice || product.price >= Number(minPrice))
    .filter((product) => !maxPrice || product.price <= Number(maxPrice))
    .filter((product) => !minDiscount || ((product.oldPrice - product.price) / product.oldPrice) * 100 >= Number(minDiscount))
    .sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "new") return products.indexOf(b) - products.indexOf(a);
      return b.popularity - a.popularity;
    }), [products, query, category, subcategory, brand, size, minPrice, maxPrice, minDiscount, sort]);

  function clearFilters() {
    setParams(query ? { q: query } : {});
  }

  return (
    <section className="catalog-page">
      <div className="catalog-heading">
        <div>
          <div className="breadcrumbs"><a href="/">Home</a><span>/</span><span>{category || "Shop all"}</span></div>
          <span className="eyebrow">THE STYLEKART COLLECTION</span>
          <h1>{query ? `Results for “${query}”` : category || "Shop all"}</h1>
          <p>Thoughtful finds for wherever the day takes you.</p>
        </div>
        <label className="sort-control">Sort by
          <select value={sort} onChange={(event) => setFilter("sort", event.target.value)}>
            <option value="popular">Popularity</option>
            <option value="new">New arrivals</option>
            <option value="rating">Top rated</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
      </div>
      <div className="catalog-toolbar">
        <span>{filtered.length} {filtered.length === 1 ? "piece" : "pieces"} to explore</span>
        <button className="filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
          <SlidersHorizontal size={17} /> Filters {filtersOpen ? <X size={15} /> : ""}
        </button>
      </div>
      {catalogLoading && <p className="muted-copy" role="status">Loading products…</p>}
      {catalogError && <p className="inline-error" role="alert">{catalogError}</p>}
      <div className={`catalog-layout ${filtersOpen ? "filters-visible" : ""}`}>
        <aside className="filter-panel">
          <div className="filter-panel-heading"><h2>Filters</h2><button className="text-button" onClick={clearFilters}>Clear all</button></div>
          <fieldset className="filter-group"><legend>Department</legend>
            <button className={!category ? "filter-choice selected" : "filter-choice"} onClick={() => setFilter("category", "")}>All departments</button>
            {departments.map((item) => <button className={category === item ? "filter-choice selected" : "filter-choice"} key={item} onClick={() => setFilter("category", item)}>{item}</button>)}
          </fieldset>
          <label className="filter-group">Category
            <select value={subcategory} onChange={(event) => setFilter("subcategory", event.target.value)}>
              <option value="">All categories</option>{subcategories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="filter-group">Brand
            <select value={brand} onChange={(event) => setFilter("brand", event.target.value)}>
              <option value="">All brands</option>{brands.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="filter-group">Size
            <select value={size} onChange={(event) => setFilter("size", event.target.value)}>
              <option value="">All sizes</option>{sizes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <fieldset className="filter-group"><legend>Price range</legend>
            <div className="price-inputs">
              <label><span>From</span><input type="number" min="0" placeholder="₹0" value={minPrice} onChange={(event) => setFilter("minPrice", event.target.value)} /></label>
              <label><span>To</span><input type="number" min="0" placeholder="No limit" value={maxPrice} onChange={(event) => setFilter("maxPrice", event.target.value)} /></label>
            </div>
          </fieldset>
          <label className="filter-group">Minimum discount
            <select value={minDiscount} onChange={(event) => setFilter("minDiscount", event.target.value)}>
              <option value="">Any discount</option><option value="20">20% or more</option><option value="40">40% or more</option><option value="60">60% or more</option>
            </select>
          </label>
        </aside>
        {filtered.length ? (
          <div className="product-grid catalog-products">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <div className="empty-state"><span className="empty-icon">✳</span><h2>No pieces found just yet</h2><p>Try a different search or clear some filters.</p><button className="button button-dark" onClick={clearFilters}>Clear filters</button></div>
        )}
      </div>
    </section>
  );
}
