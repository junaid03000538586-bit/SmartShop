import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { s as S, type SL } from "@/lib/searchui";
import Top from "../components/Top";
import ProductCard from "../components/ProductCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search | Smart Shop" };

type Cat = { id: string; name: string; name_ro: string | null; name_ur: string | null; slug: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const one = (k: string) => {
    const v = raw[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const q = one("q").trim().slice(0, 80);
  const catSlug = one("cat");
  const sort = one("sort");
  const inStock = one("stock") === "1";
  const featured = one("feat") === "1";
  const num = (v: string) => (v.trim() !== "" && Number(v) >= 0 ? Number(v) : null);
  const min = num(one("min"));
  const max = num(one("max"));

  const cv = (await cookies()).get("lang")?.value;
  const lang: SL = cv === "ro" || cv === "ur" ? cv : "en";
  const l = S[lang];
  const db = getSupabase();

  const { data: cats } = await db.from("categories").select("id,name,name_ro,name_ur,slug").order("sort_order");
  const catList = (cats ?? []) as Cat[];
  const catLabel = (c: Cat) => (lang === "ur" ? c.name_ur : lang === "ro" ? c.name_ro : null) ?? c.name;

  const words = q.replace(/[,()%*\\"]/g, " ").split(/\s+/).filter(Boolean).slice(0, 5);

  let query = db
    .from("products")
    .select("id,name,slug,price,original_price,stock,product_images(url,sort_order)")
    .eq("is_visible", true);

  const sel = catList.find((c) => c.slug === catSlug);
  if (sel) query = query.eq("category_id", sel.id);

  for (const w of words) {
    const lw = w.toLowerCase();
    const ids = catList
      .filter((c) => [c.name, c.name_ro, c.name_ur].some((n) => n && n.toLowerCase().includes(lw)))
      .map((c) => c.id);
    const extra = ids.length ? `,category_id.in.(${ids.join(",")})` : "";
    query = query.or(`name.ilike.%${w}%,sku.ilike.%${w}%,description.ilike.%${w}%${extra}`);
  }
  if (min !== null) query = query.gte("price", min);
  if (max !== null) query = query.lte("price", max);
  if (inStock) query = query.gt("stock", 0);
  if (featured) query = query.eq("is_featured", true);
  query =
    sort === "low"
      ? query.order("price", { ascending: true })
      : sort === "high"
      ? query.order("price", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data: products } = await query.limit(48);
  const list = products ?? [];
  const hasFilters = !!(sel || min !== null || max !== null || sort || inStock || featured);

  return (
    <>
      <Top />
      <main className="wrap">
        <style>{`
          .sf input[type=search],.sf input[type=number],.sf select{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 12px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
          .sf label{font-weight:600;font-size:.9rem}
          .sf details{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:6px 14px;margin:0 0 12px}
          .sf summary{min-height:44px;display:flex;align-items:center;font-weight:600;cursor:pointer}
          .sf .two{display:flex;gap:8px}.sf .two>div{flex:1}
          .sf .chk{display:flex;align-items:center;gap:8px;min-height:44px}
          .sf .chk input{width:24px;height:24px;margin:0}
          .sf .go{width:100%;min-height:50px;border:0;border-radius:999px;background:#c9a24b;color:#0b1f3a;font:inherit;font-weight:700;cursor:pointer}
          .sf .clr{display:block;text-align:center;min-height:44px;line-height:44px;text-decoration:underline}
        `}</style>
        <a className="back" href="/">{l.back}</a>
        <h1 className="pname" style={{ marginTop: 0 }}>{l.title}</h1>

        <form className="sf" method="get" action="/search">
          <input type="search" name="q" defaultValue={q} placeholder={l.ph} aria-label={l.ph} />
          <details open={hasFilters}>
            <summary>{l.filters}</summary>
            <label>{l.category}</label>
            <select name="cat" defaultValue={sel?.slug ?? ""}>
              <option value="">{l.allCats}</option>
              {catList.map((c) => <option key={c.id} value={c.slug}>{catLabel(c)}</option>)}
            </select>
            <div className="two">
              <div>
                <label>{l.minPrice}</label>
                <input type="number" inputMode="numeric" name="min" min="0" defaultValue={min ?? ""} />
              </div>
              <div>
                <label>{l.maxPrice}</label>
                <input type="number" inputMode="numeric" name="max" min="0" defaultValue={max ?? ""} />
              </div>
            </div>
            <label>{l.sort}</label>
            <select name="sort" defaultValue={sort === "low" || sort === "high" ? sort : ""}>
              <option value="">{l.newest}</option>
              <option value="low">{l.low}</option>
              <option value="high">{l.high}</option>
            </select>
            <div className="chk"><input type="checkbox" name="stock" value="1" defaultChecked={inStock} />{l.inStock}</div>
            <div className="chk"><input type="checkbox" name="feat" value="1" defaultChecked={featured} />{l.featured}</div>
          </details>
          <button className="go" type="submit">{l.apply}</button>
          {(q || hasFilters) && <a className="clr" href="/search">{l.clear}</a>}
        </form>

        <p className="muted">{list.length} {l.results}</p>
        {list.length === 0 ? (
          <p className="muted">{l.none}</p>
        ) : (
          <div className="grid">
            {list.map((p) => <ProductCard key={p.id} p={p} outLabel={l.out} />)}
          </div>
        )}
        {list.length === 48 && <p className="muted">{l.first}</p>}
      </main>
    </>
  );
}
