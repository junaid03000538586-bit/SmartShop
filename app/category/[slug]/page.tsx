import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { x } from "@/lib/extra";
import type { Lang } from "@/lib/i18n";
import Top from "../../components/Top";
import ProductCard from "../../components/ProductCard";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getSupabase();
  const { data: cat } = await db.from("categories").select("id,name,name_ro,name_ur").eq("slug", slug).maybeSingle();
  if (!cat) notFound();

  const lang = ((await cookies()).get("lang")?.value ?? "en") as Lang;
  const tx = x[lang] ?? x.en;
  const title = (lang === "ur" ? cat.name_ur : lang === "ro" ? cat.name_ro : null) ?? cat.name;

  const { data: products } = await db
    .from("products")
    .select("id,name,slug,price,original_price,stock,product_images(url,sort_order)")
    .eq("category_id", cat.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Top />
      <main className="wrap">
        <a className="back" href="/">{tx.back}</a>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {products && products.length > 0 ? (
          <div className="grid">
            {products.map((p) => <ProductCard key={p.id} p={p} outLabel={tx.out} />)}
          </div>
        ) : (
          <p className="muted">{tx.empty}</p>
        )}
      </main>
    </>
  );
}
