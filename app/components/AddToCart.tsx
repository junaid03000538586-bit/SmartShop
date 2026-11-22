"use client";
import { useState } from "react";
import { c, type L } from "@/lib/cartui";
import { readCart, writeCart, itemKey } from "@/lib/cart";

type P = { id: string; slug: string; name: string; price: number; image: string | null; stock: number; sizes: string[]; colors: string[] };

export default function AddToCart({ p, lang }: { p: P; lang: L }) {
  const t = c[lang];
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  if (p.stock < 1) return null;

  function add() {
    setOk(false);
    if (p.sizes.length && !size) return setMsg(t.chooseSize);
    if (p.colors.length && !color) return setMsg(t.chooseColor);
    const cart = readCart();
    const item = { productId: p.id, slug: p.slug, name: p.name, price: p.price, image: p.image, size, color, qty: 1, stock: p.stock };
    const k = itemKey(item);
    const ex = cart.find((i) => itemKey(i) === k);
    if ((ex?.qty ?? 0) + 1 > p.stock) return setMsg(t.noMore);
    writeCart(ex ? cart.map((i) => (itemKey(i) === k ? { ...i, qty: i.qty + 1, stock: p.stock, price: p.price } : i)) : [...cart, item]);
    setMsg(t.added);
    setOk(true);
  }

  const pill = (v: string, cur: string | null, set: (x: string) => void) => (
    <button type="button" key={v} className={"pill" + (cur === v ? " sel" : "")} onClick={() => set(v)}>{v}</button>
  );

  return (
    <div style={{ margin: "16px 0" }}>
      <style>{`.pill{font:inherit;cursor:pointer}.pill.sel{background:#0b1f3a;color:#fff;border-color:#0b1f3a}
        .addbtn{min-height:52px;padding:0 28px;border:0;border-radius:999px;background:#c9a24b;color:#0b1f3a;font:inherit;font-weight:700;cursor:pointer}`}</style>
      {p.sizes.length > 0 && <div><strong>{t.size}</strong><div>{p.sizes.map((z) => pill(z, size, setSize))}</div></div>}
      {p.colors.length > 0 && <div><strong>{t.color}</strong><div>{p.colors.map((z) => pill(z, color, setColor))}</div></div>}
      <button className="addbtn" onClick={add}>{t.add}</button>
      {msg && <p style={{ margin: "10px 0" }}>{msg} {ok && <a href="/cart" style={{ textDecoration: "underline" }}>{t.viewCart}</a>}</p>}
    </div>
  );
}
