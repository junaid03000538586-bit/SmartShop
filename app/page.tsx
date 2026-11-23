import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { t, type Lang } from "@/lib/i18n";
import Top from "./components/Top";
import ProductCard from "./components/ProductCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lang = ((await cookies()).get("lang")?.value ?? "en") as Lang;
  const tx = t[lang] ?? t.en;
  const db = getSupabase();

  const [{ data: cats }, { data: products }, { data: settings }] = await Promise.all([
    db.from("categories").select("id,name,name_ro,name_ur,slug").order("sort_order"),
    db.from("products")
      .select("id,name,slug,price,original_price,stock,product_images(url,sort_order)")
      .eq("is_visible", true)
      .order("created_at", { ascending: false }).limit(8),
    db.from("store_settings").select("value").eq("key", "whatsapp_number").maybeSingle(),
  ]);

  const wa = (settings?.value ?? "").replace(/\D/g, "");
  const catName = (c: { name: string; name_ro: string | null; name_ur: string | null }) =>
    (lang === "ur" ? c.name_ur : lang === "ro" ? c.name_ro : null) ?? c.name;

  return (
    <>
      <Top />

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
            {products.map((p) => <ProductCard key={p.id} p={p} outLabel={tx.outOfStock} />)}
          </div>
        ) : (
          <p className="muted">{tx.empty}</p>
        )}
      </main>

      {wa && <a className="wa" href={`https://wa.me/${wa}`}>{tx.whatsapp}</a>}
    </>
  );
}
