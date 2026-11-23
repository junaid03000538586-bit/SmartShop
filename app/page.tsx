import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { LANGS, t, type Lang } from "@/lib/i18n";
import { setLang } from "./actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lang = ((await cookies()).get("lang")?.value ?? "en") as Lang;
  const tx = t[lang] ?? t.en;
  const db = getSupabase();

  const [{ data: cats }, { data: products }, { data: settings }] = await Promise.all([
    db.from("categories").select("id,name,name_ro,name_ur,slug").order("sort_order"),
    db.from("products")
      .select("id,name,slug,price,original_price,stock,product_images(url,sort_order)")
      .order("created_at", { ascending: false }).limit(8),
    db.from("store_settings").select("value").eq("key", "whatsapp_number").maybeSingle(),
  ]);

  const wa = (settings?.value ?? "").replace(/\D/g, "");
  const catName = (c: { name: string; name_ro: string | null; name_ur: string | null }) =>
    (lang === "ur" ? c.name_ur : lang === "ro" ? c.name_ro : null) ?? c.name;

  return (
    <>
      <header className="top">
        <div className="wrap">
          <a className="brand" href="/">Smart Shop</a>
          <form action={setLang} className="langs">
            {LANGS.map((l) => (
              <button key={l.code} name="lang" value={l.code} aria-pressed={lang === l.code}>
                {l.label}
              </button>
            ))}
          </form>
          <input className="search" type="search" placeholder={tx.search} aria-label={tx.search} />
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <h1>{tx.heroTitle}</h1>
          <p>{tx.heroText}</p>
          <a className="btn" href="#new">{tx.shopNow}</a>
        </div>
      </section>

      <main className="wrap">
        <h2>{tx.categories}</h2>
        <div className="chips">
          {(cats ?? []).map((c) => (
            <a key={c.id} className="chip" href={`/category/${c.slug}`}>{catName(c)}</a>
          ))}
        </div>

        <h2 id="new">{tx.newArrivals}</h2>
        {products && products.length > 0 ? (
          <div className="grid">
            {products.map((p) => {
              const img = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
              return (
                <a key={p.id} className="card" href={`/product/${p.slug}`}>
                  {img ? <img src={img.url} alt={p.name} loading="lazy" /> : <div className="ph" />}
                  <div className="body">
                    <div>{p.name}</div>
                    <div className="price">
                      Rs. {Number(p.price).toLocaleString("en-PK")}
                      {p.original_price && <span className="old">Rs. {Number(p.original_price).toLocaleString("en-PK")}</span>}
                    </div>
                    {p.stock < 1 && <div className="muted">{tx.outOfStock}</div>}
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <p className="muted">{tx.empty}</p>
        )}
      </main>

      {wa && <a className="wa" href={`https://wa.me/${wa}`}>{tx.whatsapp}</a>}
    </>
  );
}
