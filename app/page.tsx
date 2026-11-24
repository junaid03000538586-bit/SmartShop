import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { t, type Lang } from "@/lib/i18n";
import Top from "./components/Top";
import ProductCard from "./components/ProductCard";
import WelcomeBar from "./components/WelcomeBar";

export const dynamic = "force-dynamic";

type Banner = {
  id: string; title: string | null; subtitle: string | null; title_ro: string | null; subtitle_ro: string | null;
  title_ur: string | null; subtitle_ur: string | null; button_text: string | null; link_url: string | null; image_url: string | null;
};

const okLink = (u: string | null) =>
  !!u && ((u.startsWith("/") && !u.startsWith("//")) || /^https:\/\/[^\s"'<>]+$/.test(u));
const okImg = (u: string | null) => !!u && /^https:\/\/[^\s"'()<>]+$/.test(u);

export default async function Home() {
  const lang = ((await cookies()).get("lang")?.value ?? "en") as Lang;
  const tx = t[lang] ?? t.en;
  const db = getSupabase();

  const [{ data: cats }, { data: products }, { data: settings }, { data: banners }] = await Promise.all([
    db.from("categories").select("id,name,name_ro,name_ur,slug").order("sort_order"),
    db.from("products")
      .select("id,name,slug,price,original_price,stock,product_images(url,sort_order)")
      .eq("is_visible", true)
      .order("created_at", { ascending: false }).limit(8),
    db.from("store_settings").select("value").eq("key", "whatsapp_number").maybeSingle(),
    db.from("banners")
      .select("id,title,subtitle,title_ro,subtitle_ro,title_ur,subtitle_ur,button_text,link_url,image_url")
      .eq("is_active", true).order("sort_order", { ascending: true }),
  ]);

  const wa = (settings?.value ?? "").replace(/\D/g, "");
  const slides = (banners ?? []) as Banner[];
  const catName = (c: { name: string; name_ro: string | null; name_ur: string | null }) =>
    (lang === "ur" ? c.name_ur : lang === "ro" ? c.name_ro : null) ?? c.name;

  return (
    <>
      <Top />
      <WelcomeBar lang={lang} />

      {slides.length > 0 ? (
        <section>
          <style>{`
            .bn-row{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;background:#0b1f3a}
            .bn-slide{flex:0 0 100%;scroll-snap-align:start;min-height:300px;display:flex;align-items:center;color:#fff;padding:40px 0;background:linear-gradient(135deg,#0b1f3a,#16315a);background-size:cover;background-position:center}
            .bn-slide h2{font-family:Georgia,"Times New Roman",serif;font-size:clamp(1.8rem,6vw,3rem);line-height:1.15;margin:0 0 12px;color:#fff;max-width:18ch}
            .bn-slide p{max-width:46ch;margin:0 0 20px;opacity:.92}
          `}</style>
          <div className="bn-row">
            {slides.map((b) => {
              const title = (lang === "ur" ? b.title_ur : lang === "ro" ? b.title_ro : null) || b.title;
              const sub = (lang === "ur" ? b.subtitle_ur : lang === "ro" ? b.subtitle_ro : null) || b.subtitle;
              const style = okImg(b.image_url)
                ? { backgroundImage: `linear-gradient(135deg, rgba(11,31,58,.82), rgba(22,49,90,.5)), url(${b.image_url})` }
                : undefined;
              return (
                <div className="bn-slide" key={b.id} style={style}>
                  <div className="wrap">
                    {title && <h2>{title}</h2>}
                    {sub && <p>{sub}</p>}
                    {b.button_text && okLink(b.link_url) && <a className="btn" href={b.link_url as string}>{b.button_text}</a>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="hero">
          <div className="wrap">
            <h1>{tx.heroTitle}</h1>
            <p>{tx.heroText}</p>
            <a className="btn" href="#new">{tx.shopNow}</a>
          </div>
        </section>
      )}

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
