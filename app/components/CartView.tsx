"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";
import { c, type L } from "@/lib/cartui";
import { useCart, readCart, writeCart, itemKey, type Item } from "@/lib/cart";

export default function CartView({ lang }: { lang: L }) {
  const t = c[lang];
  const [items, ready] = useCart();
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      const cur = readCart();
      if (!cur.length) return;
      const ids = [...new Set(cur.map((i) => i.productId))];
      const { data } = await supabase.from("products").select("id,price,stock").in("id", ids);
      const m = new Map((data ?? []).map((p) => [p.id, p] as const));
      let changed = false, removed = false;
      const next = cur.flatMap<Item>((i) => {
        const p = m.get(i.productId);
        const qty = p ? Math.min(i.qty, Math.max(p.stock, 0)) : 0;
        if (!p || qty < 1) { removed = true; return []; }
        if (Number(p.price) !== i.price || p.stock !== i.stock || qty !== i.qty) changed = true;
        return [{ ...i, price: Number(p.price), stock: p.stock, qty }];
      });
      if (changed || removed) { writeCart(next); setNote(removed ? t.gone : t.changed); }
    })();
  }, [t.gone, t.changed]);

  const setQty = (i: Item, q: number) =>
    writeCart(items.map((x) => (itemKey(x) === itemKey(i) ? { ...x, qty: Math.max(1, Math.min(q, x.stock)) } : x)));
  const remove = (i: Item) => writeCart(items.filter((x) => itemKey(x) !== itemKey(i)));
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const rs = (n: number) => "Rs. " + n.toLocaleString("en-PK");

  return (
    <main className="wrap">
      <style>{`
        .ci{display:flex;gap:12px;background:#fff;border:1px solid #eceae4;border-radius:16px;padding:12px;margin:12px 0}
        .ci img,.ci .ph{width:84px;height:112px;object-fit:cover;border-radius:12px;flex:none;aspect-ratio:auto}
        .ci .info{flex:1;min-width:0}
        .qty{display:flex;align-items:center;gap:6px;margin:8px 0}
        .qty button{width:44px;height:44px;border-radius:50%;border:1px solid #cfcac0;background:#fff;font:inherit;font-size:1.2rem;cursor:pointer}
        .rm{min-height:44px;background:none;border:0;color:#b42318;font:inherit;text-decoration:underline;cursor:pointer}
        .tot{display:flex;justify-content:space-between;font-size:1.2rem;font-weight:700;color:#0b1f3a;margin:16px 0 4px}
        .goBtn{display:flex;justify-content:center;align-items:center;min-height:52px;border-radius:999px;background:#c9a24b;color:#0b1f3a;font-weight:700;margin:12px 0}
      `}</style>
      <h2 style={{ marginTop: 16 }}>{t.yourCart}</h2>
      {note && <p className="muted" style={{ background: "#fbf3dc", padding: "10px 14px", borderRadius: 12 }}>{note}</p>}
      {!ready && <p>{t.loading}</p>}
      {ready && items.length === 0 && (
        <>
          <p className="muted">{t.empty}</p>
          <a className="btn" href="/">{t.cont}</a>
        </>
      )}
      {items.map((i) => (
        <div className="ci" key={itemKey(i)}>
          {i.image ? <img src={i.image} alt={i.name} /> : <div className="ph" />}
          <div className="info">
            <a href={`/product/${i.slug}`}>{i.name}</a>
            {(i.size || i.color) && <div className="muted">{[i.size, i.color].filter(Boolean).join(" · ")}</div>}
            <div className="price">{rs(i.price)}</div>
            <div className="qty">
              <button aria-label="-" onClick={() => setQty(i, i.qty - 1)}>−</button>
              <strong>{i.qty}</strong>
              <button aria-label="+" onClick={() => setQty(i, i.qty + 1)}>+</button>
            </div>
            <div><strong>{rs(i.price * i.qty)}</strong> <button className="rm" onClick={() => remove(i)}>{t.remove}</button></div>
          </div>
        </div>
      ))}
      {items.length > 0 && (
        <>
          <div className="tot"><span>{t.subtotal}</span><span>{rs(subtotal)}</span></div>
          <p className="muted">{t.note}</p>
          <a className="goBtn" href="/checkout">{t.checkout}</a>
          <a href="/" style={{ textDecoration: "underline" }}>{t.cont}</a>
        </>
      )}
    </main>
  );
}
