"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";
import { k, type L } from "@/lib/checkui";
import { ad } from "@/lib/addrui";
import { useCart, writeCart } from "@/lib/cart";

type Rate = { city: string | null; charge: number };
type Addr = {
  id: string; label: string | null; full_name: string; phone: string; city: string;
  address_line: string; postal_code: string | null; is_default: boolean;
};

const SLOW_LOAD = "The server did not answer. Please check your internet and refresh the page.";
const SLOW_ORDER = "The server is slow. Please wait a moment and press Place order again. The same order will not be placed twice.";

function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

export default function CheckoutView({ lang }: { lang: L }) {
  const t = k[lang];
  const a = ad[lang];
  const [items, ready] = useCart();
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [f, setF] = useState({ name: "", phone: "", wa: "", city: "", address: "", postal: "", notes: "" });
  const [rates, setRates] = useState<Rate[]>([]);
  const [free, setFree] = useState(0);
  const [addrs, setAddrs] = useState<Addr[]>([]);
  const [pick, setPick] = useState("");
  const [saveAddr, setSaveAddr] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      let id: string | null = null;
      try {
        const { data: s } = await withTimeout(supabase.auth.getSession(), 15000);
        id = s.session?.user.id ?? null;
      } catch {
        setErr(SLOW_LOAD);
      }
      setUid(id);
      if (!id) return;
      try {
        const { data: p } = await withTimeout(
          supabase.from("profiles").select("full_name,phone").eq("id", id).maybeSingle(),
          15000
        );
        if (p) setF((o) => ({ ...o, name: p.full_name ?? "", phone: p.phone ?? "" }));

        const { data: ads } = await withTimeout(
          supabase
            .from("customer_addresses")
            .select("id,label,full_name,phone,city,address_line,postal_code,is_default")
            .eq("user_id", id)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false }),
          15000
        );
        const list = (ads ?? []) as Addr[];
        setAddrs(list);
        if (list.length > 0) {
          const d = list[0];
          setPick(d.id);
          setF((o) => ({ ...o, name: d.full_name, phone: d.phone, city: d.city, address: d.address_line, postal: d.postal_code ?? "" }));
        }

        const { data: d2 } = await withTimeout(supabase.from("delivery_settings").select("city,charge"), 15000);
        setRates((d2 ?? []).map((r) => ({ city: r.city, charge: Number(r.charge) })));
        const { data: th } = await withTimeout(
          supabase.from("store_settings").select("value").eq("key", "free_delivery_threshold").maybeSingle(),
          15000
        );
        setFree(Number(th?.value) || 0);
      } catch {
        setErr(SLOW_LOAD);
      }
    })();
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const cityRate = rates.find((r) => r.city && r.city.toLowerCase() === f.city.trim().toLowerCase());
  const base = (cityRate ?? rates.find((r) => !r.city))?.charge ?? 0;
  const delivery = free > 0 && subtotal >= free ? 0 : base;
  const rs = (n: number) => "Rs. " + n.toLocaleString("en-PK");
  const set = (key: string, v: string) => setF({ ...f, [key]: v });

  function choose(id: string) {
    setPick(id);
    const d = addrs.find((x) => x.id === id);
    if (d) {
      setF((o) => ({ ...o, name: d.full_name, phone: d.phone, city: d.city, address: d.address_line, postal: d.postal_code ?? "" }));
    } else {
      setF((o) => ({ ...o, city: "", address: "", postal: "" }));
    }
  }

  async function rememberAddress() {
    if (pick !== "" || !saveAddr || !uid) return;
    const same = addrs.some(
      (x) =>
        x.city.trim().toLowerCase() === f.city.trim().toLowerCase() &&
        x.address_line.trim().toLowerCase() === f.address.trim().toLowerCase()
    );
    if (same) return;
    try {
      await withTimeout(
        supabase.from("customer_addresses").insert({
          user_id: uid, full_name: f.name.trim(), phone: f.phone.trim(), city: f.city.trim(),
          address_line: f.address.trim(), postal_code: f.postal.trim() || null, is_default: addrs.length === 0,
        }),
        5000
      );
    } catch {
      /* the order is already placed, so a failed save is ignored */
    }
  }

  async function place(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr("");
    setBusy(true);
    try {
      let key = sessionStorage.getItem("ss_idem");
      if (!key) {
        key = crypto.randomUUID();
        sessionStorage.setItem("ss_idem", key);
      }
      const { data, error } = await withTimeout(
        supabase.rpc("place_order", {
          p_items: items.map((i) => ({ product_id: i.productId, quantity: i.qty, size: i.size, color: i.color })),
          p_full_name: f.name,
          p_phone: f.phone,
          p_whatsapp: f.wa,
          p_city: f.city,
          p_address: f.address,
          p_postal_code: f.postal,
          p_notes: f.notes,
          p_payment_method: "cod",
          p_idempotency_key: key,
        }),
        25000
      );
      if (error || !data) {
        sessionStorage.removeItem("ss_idem");
        setErr(error?.message ?? "Something went wrong. Please try again.");
        return;
      }
      sessionStorage.removeItem("ss_idem");
      await rememberAddress();
      writeCart([], false);
      window.location.href = "/order/" + (data as { order_number: string }).order_number;
    } catch {
      setErr(SLOW_ORDER);
    } finally {
      setBusy(false);
    }
  }

  const css = (
    <style>{`
      .co input[type=text],.co input[type=tel],.co textarea,.co select{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 14px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
      .co label{font-weight:600;font-size:.9rem}
      .co .go{width:100%;min-height:52px;border:0;border-radius:999px;background:#c9a24b;color:#0b1f3a;font:inherit;font-weight:700;cursor:pointer}
      .co .go:disabled{opacity:.5}
      .co .box{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:14px 0}
      .co .r{display:flex;justify-content:space-between;gap:8px;margin:4px 0}
      .co .bad{background:#fde8e6;color:#8a1c12;border-radius:12px;padding:10px 14px;margin:12px 0}
      .co .chk{display:flex;align-items:center;gap:8px;min-height:44px;margin-bottom:8px}
      .co .chk input{width:24px;height:24px;margin:0}
    `}</style>
  );

  if (!ready || uid === undefined)
    return (
      <main className="wrap co">
        {css}
        <p>{t.loading}</p>
      </main>
    );

  if (uid === null)
    return (
      <main className="wrap co">
        {css}
        <h2>{t.title}</h2>
        {err && <div className="bad">{err}</div>}
        <p>{t.needLogin}</p>
        <a className="btn" href="/login?next=/checkout">{t.login}</a>
      </main>
    );

  if (items.length === 0)
    return (
      <main className="wrap co">
        {css}
        <h2>{t.title}</h2>
        <p className="muted">{t.empty}</p>
        <a className="btn" href="/">{t.shop}</a>
      </main>
    );

  return (
    <main className="wrap co" style={{ maxWidth: 560 }}>
      {css}
      <h2>{t.title}</h2>
      <form onSubmit={place}>
        {addrs.length > 0 && (
          <>
            <label>{a.use}</label>
            <select value={pick} onChange={(e) => choose(e.target.value)}>
              {addrs.map((x) => (
                <option key={x.id} value={x.id}>
                  {(x.label ? x.label + " — " : "") + x.city + ": " + x.address_line.slice(0, 35)}
                </option>
              ))}
              <option value="">{a.newAddr}</option>
            </select>
          </>
        )}
        <label>{t.name}</label>
        <input type="text" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" required />
        <label>{t.phone}</label>
        <input type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" required />
        <label>{t.whatsapp}</label>
        <input type="tel" inputMode="tel" value={f.wa} onChange={(e) => set("wa", e.target.value)} />
        <label>{t.city}</label>
        <input type="text" value={f.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" required />
        <label>{t.address}</label>
        <textarea rows={3} value={f.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" required />
        <label>{t.postal}</label>
        <input type="text" value={f.postal} onChange={(e) => set("postal", e.target.value)} autoComplete="postal-code" />
        {pick === "" && (
          <div className="chk">
            <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} />
            {a.remember}
          </div>
        )}
        <label>{t.notes}</label>
        <textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
        <div className="box">
          <strong>{t.payment}</strong>
          <div>✓ {t.cod}</div>
          <div className="muted">{t.codNote}</div>
        </div>
        <div className="box">
          <strong>{t.summary}</strong>
          {items.map((i) => (
            <div className="r" key={i.productId + "|" + (i.size ?? "") + "|" + (i.color ?? "")}>
              <span>
                {i.name}
                {i.size || i.color ? ` (${[i.size, i.color].filter(Boolean).join(", ")})` : ""} × {i.qty}
              </span>
              <span>{rs(i.price * i.qty)}</span>
            </div>
          ))}
          <hr />
          <div className="r"><span>{t.subtotal}</span><span>{rs(subtotal)}</span></div>
          <div className="r"><span>{t.delivery}</span><span>{delivery === 0 ? t.free : rs(delivery)}</span></div>
          <div className="r"><strong>{t.total}</strong><strong>{rs(subtotal + delivery)}</strong></div>
        </div>
        {err && <div className="bad">{err}</div>}
        <button className="go" disabled={busy}>{busy ? t.placing : t.place}</button>
      </form>
    </main>
  );
         }
