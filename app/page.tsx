import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { t, type Lang } from "@/lib/i18n";
import { h, parseReviews } from "@/lib/homeui";
import Top from "./components/Top";
import WelcomeBar from "./components/WelcomeBar";
import HeroSlider, { type Slide } from "./components/HeroSlider";
import Shelf from "./components/Shelf";
import Collections, { type Tile } from "./components/Collections";
import Reviews from "./components/Reviews";
import type { CardProduct } from "./components/ProductCard";

export const dynamic = "force-dynamic";

const PCOLS = "id,name,slug,price,original_price,stock,product_images(url,sort_order)";

const okLink = (u: string | null) =>
  !!u && ((u.startsWith("/") && !u.startsWith("//")) || /^https:\/\/[^\s"'<>]+$/.test(u));
const okImg = (u: string | null) => !!u && /^https:\/\/[^\s"'()<>]+$/.test(u);

type Banner = {
  id: string; title: string | null; subtitle: string | null; title_ro: string | null; subtitle_ro: string | null;
  title_ur: string | null; subtitle_ur: string | null; button_text: string | null; link_url: string | null; image_url: string | null;
};

export default async function Home() {
  const lang = ((await cookies()).get("lang")?.value ?? "en") as Lang;
  const tx = t[lang] ?? t.en;
  const x = h[lang] ?? h.en;
  const db = getSupabase();
  const base = () => db.from("products").select(PCOLS).eq("is_visible", true);

  const [flagNew, latest, best, trend, coverRes, catRes, bannerRes, waRes, revRes] = await Promise.all([
    base().eq("is_new_arrival", true).order("created_at", { ascending: false }).limit(8),
    base().order("created_at", { ascending: false }).limit(8),
    base().eq("is_best_seller", true).order("created_at", { ascending: false }).limit(8),
    base().eq("is_featured", true).order("created_at", { ascending: false }).limit(8),
    db.from("products").select("category_id,product_images(url,sort_order)").eq("is_visible", true)
      .not("category_id", "is", null).order("created_at", { ascending: false }).limit(300),
    db.from("categories").select("id,name,name_ro,name_ur,slug").order("sort_order"),
    db.from("banners")
      .select("id,title,subtitle,title_ro,subtitle_ro,title_ur,subtitle_ur,button_text,link_url,image_url")
      .eq("is_active", true).order("sort_order", { ascending: true }),
    db.from("store_settings").select("value").eq("key", "whatsapp_number").maybeSingle(),
    db.from("store_settings").select("value").eq("key", "testimonials").maybeSingle(),
  ]);

  const asCards = (d: unknown) => ((d ?? []) as unknown as CardProduct[]);
  const newItems = asCards(flagNew.data && flagNew.data.length > 0 ? flagNew.data : latest.data);
  const bestItems = asCards(best.data);
  const trendItems = asCards(trend.data);

  const covers = new Map<string, string>();
  for (const p of (coverRes.data ?? []) as unknown as { category_id: string; product_images: { url: string; sort_order: number }[] | null }[]) {
    if (covers.has(p.category_id)) continue;
    const im = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
    if (im) covers.set(p.category_id, im.url);
  }
  const tiles: Tile[] = ((catRes.data ?? []) as { id: string; name: string; name_ro: string | null; name_ur: string | null; slug: string }[])
    .filter((c) => covers.has(c.id))
    .map((c) => ({
      slug: c.slug,
      name: (lang === "ur" ? c.name_ur : lang === "ro" ? c.name_ro : null) || c.name,
      image: covers.get(c.id) ?? null,
    }));

  const banners = (bannerRes.data ?? []) as Banner[];
  const slides: Slide[] = banners.length > 0
    ? banners.map((b) => ({
        id: b.id,
        title: (lang === "ur" ? b.title_ur : lang === "ro" ? b.title_ro : null) || b.title,
        subtitle: (lang === "ur" ? b.subtitle_ur : lang === "ro" ? b.subtitle_ro : null) || b.subtitle,
        button: b.button_text && okLink(b.link_url) ? b.button_text : null,
        link: okLink(b.link_url) ? b.link_url : null,
        image: okImg(b.image_url) ? b.image_url : null,
      }))
    : [{ id: "default", title: tx.heroTitle, subtitle: tx.heroText, button: tx.shopNow, link: "#new", image: null }];

  const wa = String(waRes.data?.value ?? "").replace(/\D/g, "");
  const reviews = parseReviews(revRes.data?.value);
  const noProducts = newItems.length === 0;

  return (
    <>
      <style>{`
        .trust{background:#fbf3dc;border-bottom:1px solid #eadfb8}
        .trust .wrap{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 22px;padding-block:4px;color:#0b1f3a;font-weight:600;font-size:.92rem}
        .trust span{display:inline-flex;align-items:center;min-height:36px}
        .sec{margin:44px 0}
        .sec-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:16px}
        .sec-head h2{margin:0;font-family:Georgia,"Times New Roman",serif;color:#0b1f3a}
        .sec-head h2::after{content:"";display:block;width:44px;height:3px;border-radius:2px;background:#c9a24b;margin-top:8px}
        .sec-head a{display:inline-flex;align-items:center;min-height:44px;text-decoration:underline;color:#0b1f3a;font-weight:600}
      `}</style>
      <Top />
      <WelcomeBar lang={lang} />
      <HeroSlider slides={slides} rtl={lang === "ur"} labels={{ prev: x.prev, next: x.next, go: x.go }} />
      <div className="trust">
        <div className="wrap"><span>✓ {x.t1}</span><span>✓ {x.t2}</span><span>✓ {x.t3}</span></div>
      </div>

      <main className="wrap">
        <Shelf id="new" title={x.newArrivals} items={newItems} outLabel={tx.outOfStock} moreHref="/search" moreLabel={x.viewAll} />
        <Shelf title={x.bestSellers} items={bestItems} outLabel={tx.outOfStock} moreHref="/search" moreLabel={x.viewAll} />
        <Shelf title={x.trending} items={trendItems} outLabel={tx.outOfStock} moreHref="/search?feat=1" moreLabel={x.viewAll} />
        <Collections title={x.collections} cta={x.shopNow} tiles={tiles} />
        <Reviews title={x.reviews} items={reviews} />
        {noProducts && <p className="muted" style={{ margin: "40px 0" }}>{tx.empty}</p>}
      </main>

      {wa && <a className="wa" href={`https://wa.me/${wa}`}>{tx.whatsapp}</a>}
    </>
  );
}
