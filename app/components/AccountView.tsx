"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";
import { a, type AL } from "@/lib/acctui";
import { k } from "@/lib/checkui";

type Order = { id: string; order_number: string; status: string; total: number; created_at: string };

const COLOR: Record<string, string> = {
  new: "#c9a24b", confirmed: "#2b6cb0", processing: "#6b46c1",
  shipped: "#0e7490", delivered: "#1f8f4e", cancelled: "#b42318",
};

function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

export default function AccountView({ lang }: { lang: AL }) {
  const t = a[lang];
  const st = k[lang].st;
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wa, setWa] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: s } = await withTimeout(supabase.auth.getSession(), 15000);
        const u = s.session?.user;
        if (!u) { setUid(null); return; }
        setUid(u.id);
        setEmail(u.email ?? "");
        const { data: p } = await withTimeout(
          supabase.from("profiles").select("full_name,phone,whatsapp").eq("id", u.id).maybeSingle(),
          15000
        );
        if (p) { setName(p.full_name ?? ""); setPhone(p.phone ?? ""); setWa(p.whatsapp ?? ""); }
        const { data: o } = await withTimeout(
          supabase.from("orders").select("id,order_number,status,total,created_at")
            .eq("user_id", u.id).order("created_at", { ascending: false }).limit(50),
          15000
        );
        setOrders((o as Order[]) ?? []);
      } catch {
        setErr(t.slow);
        setUid((x) => (x === undefined ? null : x));
      }
    })();
  }, [t.slow]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (name.trim().length < 2) return setErr(t.nameBad);
    if (phone.replace(/\D/g, "").length < 10) return setErr(t.phoneBad);
    setBusy(true);
    try {
      const { error } = await withTimeout(
        supabase.from("profiles").update({ full_name: name.trim(), phone: phone.trim(), whatsapp: wa.trim() || null }).eq("id", uid as string),
        15000
      );
      if (error) setErr(error.message); else setMsg(t.saved);
    } catch {
      setErr(t.slow);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const rs = (n: number) => "Rs. " + Number(n).toLocaleString("en-PK");
  const day = (s: string) => new Date(s).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium" });

  const css = (
    <style>{`
      .ac input{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 14px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
      .ac label{font-weight:600;font-size:.9rem}
      .ac .go{width:100%;min-height:50px;border:0;border-radius:999px;background:#c9a24b;color:#0b1f3a;font:inherit;font-weight:700;cursor:pointer}
      .ac .go:disabled{opacity:.5}
      .ac .lnk{display:block;width:100%;min-height:48px;background:none;border:0;color:#b42318;font:inherit;text-decoration:underline;cursor:pointer}
      .ac .box{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:12px 0;display:block;color:inherit}
      .ac .between{display:flex;justify-content:space-between;gap:8px;align-items:center}
      .ac .pill{display:inline-block;padding:2px 12px;border-radius:999px;color:#fff;font-size:.85rem;font-weight:600;margin:0}
      .ac .note{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
      .ac .bad{background:#fde8e6;color:#8a1c12;border-radius:12px;padding:10px 14px;margin:12px 0}
    `}</style>
  );

  if (uid === undefined)
    return <main className="wrap ac">{css}<p>{t.loading}</p></main>;

  if (uid === null)
    return (
      <main className="wrap ac" style={{ maxWidth: 560 }}>
        {css}
        <h2>{t.title}</h2>
        {err && <div className="bad">{err}</div>}
        <p>{t.needLogin}</p>
        <a className="btn" href="/login?next=/account">{t.login}</a>
      </main>
    );

  return (
    <main className="wrap ac" style={{ maxWidth: 560 }}>
      {css}
      <a className="back" href="/">{t.back}</a>
      <h2 style={{ marginTop: 0 }}>{t.title}</h2>
      <p className="muted">{email}</p>

      <div className="box">
        <strong>{t.profile}</strong>
        <form onSubmit={save} style={{ marginTop: 10 }}>
          <label>{t.name}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <label>{t.phone}</label>
          <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          <label>{t.wa}</label>
          <input type="tel" inputMode="tel" value={wa} onChange={(e) => setWa(e.target.value)} />
          {msg && <div className="note">{msg}</div>}
          {err && <div className="bad">{err}</div>}
          <button className="go" disabled={busy}>{busy ? t.saving : t.save}</button>
        </form>
      </div>

      <h3>{t.orders}</h3>
      {orders.length === 0 && (
        <>
          <p className="muted">{t.none}</p>
          <a className="btn" href="/">{t.shop}</a>
        </>
      )}
      {orders.map((o) => (
        <a className="box" key={o.id} href={`/order/${o.order_number}`}>
          <div className="between"><strong>{o.order_number}</strong><span className="pill" style={{ background: COLOR[o.status] ?? "#666" }}>{st[o.status] ?? o.status}</span></div>
          <div className="between"><span className="muted">{day(o.created_at)}</span><strong>{rs(o.total)}</strong></div>
          <div style={{ textDecoration: "underline", marginTop: 6 }}>{t.view}</div>
        </a>
      ))}

      <button className="lnk" onClick={logout}>{t.logout}</button>
    </main>
  );
}
