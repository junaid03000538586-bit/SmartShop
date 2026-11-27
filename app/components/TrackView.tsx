"use client";
import { useState } from "react";
import { supabase } from "@/lib/browser";
import { k, type L } from "@/lib/checkui";
import { tr } from "@/lib/trackui";

type Item = { name: string; qty: number; size: string | null; color: string | null };
type Found = {
  order_number: string; status: string; created_at: string; updated_at: string; city: string;
  subtotal: number; delivery_charge: number; total: number; items: Item[];
};

const STEPS = ["new", "confirmed", "processing", "shipped", "delivered"];

function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

export default function TrackView({ lang, initial, wa }: { lang: L; initial: string; wa: string }) {
  const t = tr[lang];
  const st = k[lang].st;
  const [num, setNum] = useState(initial);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<Found | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr(""); setRes(null);
    if (num.trim().length < 8 || phone.replace(/\D/g, "").length < 10) { setErr(t.need); return; }
    setBusy(true);
    try {
      const { data, error } = await withTimeout(
        supabase.rpc("track_order", { p_order_number: num.trim(), p_phone: phone.trim() }),
        15000
      );
      if (error) throw error;
      const d = data as { ok?: boolean } | null;
      if (d && d.ok) setRes(d as unknown as Found);
      else setErr(t.notFound);
    } catch {
      setErr(t.slow);
    } finally {
      setBusy(false);
    }
  }

  const rs = (n: number) => "Rs. " + Number(n).toLocaleString("en-PK");
  const when = (s: string) => new Date(s).toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" });
  const idx = res ? STEPS.indexOf(res.status) : -1;

  return (
    <main className="wrap tk" style={{ maxWidth: 560 }}>
      <style>{`
        .tk input{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 14px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
        .tk label{font-weight:600;font-size:.9rem}
        .tk .go{width:100%;min-height:52px;border:0;border-radius:999px;background:#c9a24b;color:#0b1f3a;font:inherit;font-weight:700;cursor:pointer}
        .tk .go:disabled{opacity:.5}
        .tk .box{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:14px 0}
        .tk .bad{background:#fde8e6;color:#8a1c12;border-radius:12px;padding:10px 14px;margin:12px 0}
        .tk .between{display:flex;justify-content:space-between;gap:8px;margin:4px 0}
        .tk ol{list-style:none;margin:12px 0;padding:0}
        .tk li{display:flex;align-items:center;gap:12px;min-height:44px;color:#8a8577;position:relative}
        .tk li::before{content:"";position:absolute;inset-inline-start:13px;top:-22px;height:22px;width:2px;background:#d9d4c7}
        .tk li:first-child::before{display:none}
        .tk .dot{width:28px;height:28px;border-radius:50%;border:2px solid #d9d4c7;background:#fff;display:flex;align-items:center;justify-content:center;font-size:.85rem;flex:none}
        .tk li.on{color:#0b1f3a;font-weight:600}
        .tk li.on .dot{background:#c9a24b;border-color:#c9a24b;color:#0b1f3a}
        .tk li.on::before{background:#c9a24b}
        .tk li.cur .dot{box-shadow:0 0 0 4px rgba(201,162,75,.3)}
        .tk .lnk{display:block;width:100%;min-height:48px;background:none;border:0;color:#0b1f3a;font:inherit;text-decoration:underline;cursor:pointer;text-align:center}
      `}</style>
      <a className="back" href="/">{t.back}</a>
      <h2 style={{ marginTop: 0 }}>{t.title}</h2>
      <p className="muted">{t.intro}</p>

      <form onSubmit={submit}>
        <label>{t.orderNo}</label>
        <input value={num} onChange={(e) => setNum(e.target.value)} placeholder={t.orderPh} autoCapitalize="characters" autoComplete="off" />
        <label>{t.phone}</label>
        <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        {err && <div className="bad">{err}</div>}
        <button className="go" disabled={busy}>{busy ? t.wait : t.btn}</button>
      </form>

      {res && (
        <>
          <div className="box">
            <div className="between"><strong>{res.order_number}</strong><strong>{st[res.status] ?? res.status}</strong></div>
            {res.status === "cancelled" ? (
              <div className="bad">{t.cancelled}</div>
            ) : (
              <ol>
                {STEPS.map((s, i) => (
                  <li key={s} className={(i <= idx ? "on" : "") + (i === idx ? " cur" : "")}>
                    <span className="dot">{i <= idx ? "✓" : ""}</span>
                    <span>{st[s]}</span>
                  </li>
                ))}
              </ol>
            )}
            {res.status === "shipped" && <p className="muted">{t.shippedNote}</p>}
            <div className="between"><span className="muted">{t.placed}</span><span>{when(res.created_at)}</span></div>
            <div className="between"><span className="muted">{t.updated}</span><span>{when(res.updated_at)}</span></div>
            <div className="between"><span className="muted">{t.city}</span><span>{res.city}</span></div>
          </div>

          <div className="box">
            <strong>{t.items}</strong>
            {res.items.map((it, i) => (
              <div className="between" key={i}>
                <span>{it.name}{it.size || it.color ? ` (${[it.size, it.color].filter(Boolean).join(", ")})` : ""} × {it.qty}</span>
              </div>
            ))}
            <hr />
            <div className="between"><span>{t.subtotal}</span><span>{rs(res.subtotal)}</span></div>
            <div className="between"><span>{t.delivery}</span><span>{Number(res.delivery_charge) === 0 ? t.free : rs(res.delivery_charge)}</span></div>
            <div className="between"><strong>{t.total}</strong><strong>{rs(res.total)}</strong></div>
            <p className="muted">{t.cod}</p>
          </div>

          {wa && (
            <a className="btn" style={{ background: "#1f8f4e", color: "#fff", width: "100%", justifyContent: "center" }}
               href={`https://wa.me/${wa}?text=${encodeURIComponent(t.askMsg(res.order_number))}`}>
              {t.help} {t.ask}
            </a>
          )}
          <button className="lnk" onClick={() => { setRes(null); setNum(""); setPhone(""); }}>{t.another}</button>
        </>
      )}
    </main>
  );
}
