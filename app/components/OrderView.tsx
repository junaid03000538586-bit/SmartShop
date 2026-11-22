"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";
import { k, type L } from "@/lib/checkui";

type Order = {
  id: string; order_number: string; status: string; customer_name: string; phone: string;
  city: string; address: string; subtotal: number; delivery_charge: number; total: number;
};
type Line = { product_name: string; quantity: number; size: string | null; color: string | null; line_total: number };

export default function OrderView({ lang, number }: { lang: L; number: string }) {
  const t = k[lang];
  const [o, setO] = useState<Order | null | undefined>(undefined);
  const [lines, setLines] = useState<Line[]>([]);
  const [wa, setWa] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("orders").select("id,order_number,status,customer_name,phone,city,address,subtotal,delivery_charge,total").eq("order_number", number).maybeSingle();
      setO((data as Order | null) ?? null);
      if (data) {
        const { data: li } = await supabase.from("order_items").select("product_name,quantity,size,color,line_total").eq("order_id", data.id);
        setLines((li as Line[]) ?? []);
      }
      const { data: s } = await supabase.from("store_settings").select("value").eq("key", "whatsapp_number").maybeSingle();
      setWa(String(s?.value ?? "").replace(/\D/g, ""));
    })();
  }, [number]);

  const rs = (n: number) => "Rs. " + Number(n).toLocaleString("en-PK");
  if (o === undefined) return <main className="wrap"><p>{t.loading}</p></main>;
  if (o === null) return <main className="wrap"><p>{t.notFound}</p><a className="btn" href="/">{t.shop}</a></main>;

  const msg = `${t.orderNo}: ${o.order_number}\n${t.total}: ${rs(o.total)}\n${o.customer_name}, ${o.phone}`;
  return (
    <main className="wrap" style={{ maxWidth: 560 }}>
      <h2>{t.done}</h2>
      <div className="card" style={{ padding: 14 }}>
        <p><strong>{t.orderNo}:</strong> {o.order_number}</p>
        <p><strong>{t.status}:</strong> {t.st[o.status] ?? o.status}</p>
        <p><strong>{t.items}:</strong></p>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>{l.product_name}{(l.size || l.color) ? ` (${[l.size, l.color].filter(Boolean).join(", ")})` : ""} × {l.quantity}</span>
            <span>{rs(l.line_total)}</span>
          </div>
        ))}
        <hr />
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t.subtotal}</span><span>{rs(o.subtotal)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t.delivery}</span><span>{Number(o.delivery_charge) === 0 ? t.free : rs(o.delivery_charge)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><strong>{t.total}</strong><strong>{rs(o.total)}</strong></div>
        <p><strong>{t.deliverTo}:</strong><br />{o.address}, {o.city}</p>
        <p className="muted">{t.cod}</p>
      </div>
      {wa && <a className="btn" style={{ background: "#1f8f4e", color: "#fff", margin: "14px 0" }} href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`}>{t.wa}</a>}
      <p><a href="/" style={{ textDecoration: "underline" }}>{t.shop}</a></p>
    </main>
  );
}
