import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { x } from "@/lib/extra";
import type { L } from "@/lib/cartui";
import Top from "../../components/Top";
import AddToCart from "../../components/AddToCart";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const { data } = await getSupabase()
    .from("products")
    .select("id,sku,name,description,price,original_price,stock,sizes,colors,product_images(url,sort_order)")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return { title: "Smart Shop" };
  const img = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  return {
    title: `${p.name} | Smart Shop`,
    description: String(p.description ?? p.name).slice(0, 150),
    openGraph: { title: p.name, images: img ? [img] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();

  const v = (await cookies()).get("lang")?.value;
  const lang: L = v === "ro" || v === "ur" ? v : "en";
  const tx = x[lang];
  const host = (await headers()).get("host");
  const url = `https://${host}/product/${slug}`;

  const { data: s } = await getSupabase().from("store_settings").select("value").eq("key", "whatsapp_number").maybeSingle();
  const wa = String(s?.value ?? "").replace(/\D/g, "");
  const msg = `${p.name}\n${tx.sku}: ${p.sku}\n${url}`;

  const imgs = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const price = Number(p.price);
  const old = p.original_price ? Number(p.original_price) : 0;
  const off = old > price ? Math.round(((old - price) / old) * 100) : 0;

  return (
    <>
      <Top />
      <main className="wrap">
        <a className="back" href="/">{tx.back}</a>
        {imgs.length > 0 && (
          <div className="gallery">
            {imgs.map((im, i) => <img key={i} src={im.url} alt={p.name} loading={i === 0 ? "eager" : "lazy"} />)}
          </div>
        )}
        <h1 className="pname">{p.name}</h1>
        <div className="price" style={{ fontSize: "1.4rem" }}>
          Rs. {price.toLocaleString("en-PK")}
          {old > price && <span className="old">Rs. {old.toLocaleString("en-PK")}</span>}
          {off > 0 && <span className="badge">{off}{tx.off}</span>}
        </div>
        <p className={p.stock > 0 ? "stock-ok" : "stock-out"}>{p.stock > 0 ? tx.inStock : tx.out}</p>
        <AddToCart
          lang={lang}
          p={{ id: p.id, slug, name: p.name, price, image: imgs[0]?.url ?? null, stock: p.stock, sizes: p.sizes ?? [], colors: p.colors ?? [] }}
        />
        {p.description && <p style={{ whiteSpace: "pre-line" }}>{p.description}</p>}
        <p className="muted">{tx.sku}: {p.sku}</p>
        {wa && <a className="btn" style={{ background: "#1f8f4e", color: "#fff" }} href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`}>{tx.ask}</a>}
      </main>
    </>
  );
}
