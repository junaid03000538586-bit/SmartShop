"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";
import { myWishlistId, withTimeout } from "@/lib/wishlist";
import { w, type WL } from "@/lib/wishui";
import { readCart, writeCart, itemKey } from "@/lib/cart";

type Row = {
  id: string; productId: string; slug: string; name: string; price: number;
  stock: number; needsOptions: boolean; image: string | null;
};

export default function WishlistView({ lang }: { lang: WL }) {
  const t = w[lang];
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { uid: u, wid } = await withTimeout(myWishlistId(false), 15000);
        setUid(u);
        if (!u || !wid) return;
        const { data, error } = await withTimeout(
          supabase
            .from("wishlist_items")
            .select("id,product_id,created_at,products(name,slug,price,stock,sizes,colors,product_images(url,sort_order))")
            .eq("wishlist_id", wid)
            .order("created_at", { ascending: false }),
          15000
        );
        if (error) throw error;
        setRows(
          (data ?? []).flatMap((r: any): Row[] => {
            const p = Array.isArray(r.products) ? r.products[0] : r.products;
            if (!p) return [];
            const img = [...(p.product_images ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
            return [{
              id: r.id, productId: r.product_id, slug: p.slug, name: p.name, price: Number(p.price), stock: p.stock,
              needsOptions: (p.sizes ?? []).length > 0 || (p.colors ?? []).length > 0, image: img?.url ?? null,
            }];
          })
        );
      } catch {
        setErr(t.slow);
        setUid((x) => (x === undefined ? null : x));
      }
    })();
  }, [t.slow]);

  async function remove(r: Row, note?: string) {
    const { error } = await supabase.from("wishlist_items").delete().eq("id", r.id);
    if (error) { setErr(error.message); return; }
    setRows((list) => list.filter((x) => x.id !== r.id));
    setMsg(note ?? "");
  }

  function toCart(r: Row) {
    setErr(""); setMsg("");
    if (r.stock < 1) return;
    const cart = readCart();
    const item = { productId: r.productId, slug: r.slug, name: r.name, price: r.price, image: r.image, size: null, color: null, qty: 1, stock: r.stock };
    const key = itemKey(item);
    const ex = cart.find((i) => itemKey(i) === key);
    if ((ex?.qty ?? 0) + 1 > r.stock) { setMsg(t.noMore); return; }
    writeCart(ex ? cart.map((i) => (itemKey(i) === key ? { ...i, qty: i.qty + 1, stock: r.stock, price: r.price } : i)) : [...cart, item]);
    remove(r, t.moved);
  }

  const rs = (n: number) => "Rs. " + n.toLocaleString("en-PK");
  const css = (
    <style>{`
      .wl .it{display:flex;gap:12px;background:#fff;border:1px solid #eceae4;border-radius:16px;padding:12px;margin:12px 0}
      .wl .it img,.wl .it .ph{width:84px;height:112px;object-fit:cover;border-radius:12px;flex:none;aspect-ratio:auto}
      .wl .info{flex:1;min-width:0}
      .wl .btnrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
      .wl .gold{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:0;border-radius:999px;background:#c9a24b;color:#0b1f3a;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}
      .wl .rm{min-height:46px;background:none;border:0;color:#b42318;font:inherit;text-decoration:underline;cursor:pointer}
      .wl .note{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
      .wl .bad{background:#fde8e6;color:#8a1c12;border-radius:12px;padding:10px 14px;margin:12px 0}
    `}</style>
  );

  if (uid === undefined) return <main className="wrap wl">{css}<p>{t.loading}</p></main>;
  if (uid === null)
    return (
      <main className="wrap wl">
        {css}
        <h2>{t.title}</h2>
        {err && <div className="bad">{err}</div>}
        <p>{t.needLogin}</p>
        <a className="btn" href="/login?next=/wishlist">{t.login}</a>
      </main>
    );

  return (
    <main className="wrap wl" style={{ maxWidth: 560 }}>
      {css}
      <a className="back" href="/">{t.back}</a>
      <h2 style={{ marginTop: 0 }}>{t.title}</h2>
      {msg && <div className="note">{msg}</div>}
      {err && <div className="bad">{err}</div>}
      {rows.length === 0 && (
        <>
          <p className="muted">{t.empty}</p>
          <a className="btn" href="/">{t.shop}</a>
        </>
      )}
      {rows.map((r) => (
        <div className="it" key={r.id}>
          {r.image ? <img src={r.image} alt={r.name} /> : <div className="ph" />}
          <div className="info">
            <a href={`/product/${r.slug}`}>{r.name}</a>
            <div className="price">{rs(r.price)}</div>
            {r.stock < 1 && <div className="muted">{t.out}</div>}
            <div className="btnrow">
              {r.stock >= 1 && (r.needsOptions
                ? <a className="gold" href={`/product/${r.slug}`}>{t.choose}</a>
                : <button className="gold" onClick={() => toCart(r)}>{t.move}</button>)}
              <button className="rm" onClick={() => remove(r)}>{t.remove}</button>
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}
