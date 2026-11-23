"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/browser";

type City = { id: string; city: string; charge: number; is_active: boolean };

const STORE_KEYS = [
  "store_name", "store_description", "contact_phone", "whatsapp_number", "store_email",
  "facebook_url", "instagram_url", "tiktok_url",
];
const POLICY_KEYS = ["about_us", "return_policy", "privacy_policy", "terms_and_conditions"];

function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("The server did not answer. Please try again.")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

function normalizeWa(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("92")) return d;
  if (d.startsWith("0")) return "92" + d.slice(1);
  if (d.length === 10 && d.startsWith("3")) return "92" + d;
  return d;
}

export default function AdminSettings() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [s, setS] = useState<Record<string, string>>({});
  const [defId, setDefId] = useState<string | null>(null);
  const [defCharge, setDefCharge] = useState("");
  const [free, setFree] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [newCity, setNewCity] = useState("");
  const [newCharge, setNewCharge] = useState("");

  const load = useCallback(async () => {
    const st = await supabase.from("store_settings").select("key,value");
    if (st.error) { setMsg(st.error.message); return; }
    const m: Record<string, string> = {};
    (st.data ?? []).forEach((r: { key: string; value: string }) => { m[r.key] = r.value; });
    setS(m);
    setFree(m["free_delivery_threshold"] ?? "");
    const d = await supabase.from("delivery_settings").select("id,city,charge,is_active").order("city", { ascending: true });
    if (d.error) { setMsg(d.error.message); return; }
    const rows = (d.data ?? []) as { id: string; city: string | null; charge: number; is_active: boolean }[];
    const def = rows.find((r) => r.city === null);
    setDefId(def?.id ?? null);
    setDefCharge(def ? String(def.charge) : "");
    setCities(rows.filter((r) => r.city !== null).map((r) => ({ id: r.id, city: r.city as string, charge: Number(r.charge), is_active: r.is_active })));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await withTimeout(supabase.auth.getSession(), 15000);
        if (sess.session) {
          const { data, error } = await withTimeout(supabase.rpc("is_admin"), 15000);
          if (error) setMsg(error.message);
          setIsAdmin(data === true);
          if (data === true) await load();
        }
      } catch (e) {
        setMsg((e as Error).message);
      } finally {
        setReady(true);
      }
    })();
  }, [load]);

  const set = (k: string, v: string) => setS((o) => ({ ...o, [k]: v }));

  async function saveKeys(keys: string[], extra?: Record<string, string>) {
    const rows = keys.map((k) => ({ key: k, value: (s[k] ?? "").trim() }));
    if (extra) Object.entries(extra).forEach(([key, value]) => rows.push({ key, value }));
    const { error } = await supabase.from("store_settings").upsert(rows, { onConflict: "key" });
    return error;
  }

  async function saveStore() {
    const wa = normalizeWa(s["whatsapp_number"] ?? "");
    if (wa && (wa.length < 11 || wa.length > 15)) { setMsg("WhatsApp number looks wrong. Example: 0300 1234567"); return; }
    const mail = (s["store_email"] ?? "").trim();
    if (mail && !/^\S+@\S+\.\S+$/.test(mail)) { setMsg("Store email looks wrong."); return; }
    for (const k of ["facebook_url", "instagram_url", "tiktok_url"]) {
      const v = (s[k] ?? "").trim();
      if (v && !/^https?:\/\//i.test(v)) { setMsg("Social links must start with https://"); return; }
    }
    setBusy(true); setMsg("Saving…");
    const keys = STORE_KEYS.filter((k) => k !== "whatsapp_number");
    const error = await saveKeys(keys, { whatsapp_number: wa });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setMsg("Store details saved.");
    await load();
  }

  async function savePolicies() {
    setBusy(true); setMsg("Saving…");
    const error = await saveKeys(POLICY_KEYS);
    setBusy(false);
    setMsg(error ? error.message : "Policies saved.");
  }

  async function saveDelivery() {
    const n = Number(defCharge);
    if (defCharge.trim() === "" || !(n >= 0)) { setMsg("Default delivery charge must be a number (0 or more)."); return; }
    const f = free.trim();
    if (f !== "" && !(Number(f) >= 0)) { setMsg("Free delivery amount must be a number, or leave it empty."); return; }
    setBusy(true); setMsg("Saving…");
    const res = defId
      ? await supabase.from("delivery_settings").update({ charge: n }).eq("id", defId)
      : await supabase.from("delivery_settings").insert({ city: null, charge: n });
    if (res.error) { setBusy(false); setMsg(res.error.message); return; }
    const err2 = await supabase.from("store_settings").upsert({ key: "free_delivery_threshold", value: f }, { onConflict: "key" });
    setBusy(false);
    if (err2.error) { setMsg(err2.error.message); return; }
    setMsg("Delivery settings saved.");
    await load();
  }

  async function addCity() {
    const c = newCity.trim();
    const n = Number(newCharge);
    if (c.length < 2) { setMsg("Please type the city name."); return; }
    if (newCharge.trim() === "" || !(n >= 0)) { setMsg("City charge must be a number (0 or more)."); return; }
    setBusy(true);
    const { error } = await supabase.from("delivery_settings").insert({ city: c, charge: n, is_active: true });
    setBusy(false);
    if (error) { setMsg(error.message.includes("duplicate") ? "This city already has a rate." : error.message); return; }
    setNewCity(""); setNewCharge(""); setMsg("City rate added.");
    await load();
  }

  async function updateCity(id: string, patch: Partial<City>) {
    const { error } = await supabase.from("delivery_settings").update(patch).eq("id", id);
    setMsg(error ? error.message : "City rate updated.");
    await load();
  }

  async function deleteCity(id: string) {
    if (!confirm("Delete this city rate? That city will use the default charge.")) return;
    const { error } = await supabase.from("delivery_settings").delete().eq("id", id);
    setMsg(error ? error.message : "City rate deleted.");
    await load();
  }

  const css = (
    <style>{`
      .st{max-width:720px;margin:0 auto;padding:16px;font-family:system-ui,sans-serif;color:#1b2430}
      .st h1{font-family:Georgia,serif;color:#0b1f3a}
      .st input,.st textarea{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 12px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
      .st label{font-weight:600;font-size:.9rem}
      .st small{display:block;opacity:.7;margin:-6px 0 12px}
      .st button,.st a.b{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border:0;border-radius:999px;background:#0b1f3a;color:#fff;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}
      .st .gold{background:#c9a24b;color:#0b1f3a}.st .red{background:#b42318}
      .st button:disabled{opacity:.5}
      .st .card{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:14px 0}
      .st .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.st .row>*{flex:1}
      .st .msg{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
      .st .chk{display:flex;align-items:center;gap:8px;min-height:44px}
      .st .chk input{width:24px;min-height:24px;margin:0}
    `}</style>
  );

  const text = (label: string, k: string, hint?: string) => (
    <>
      <label>{label}</label>
      <input value={s[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
      {hint && <small>{hint}</small>}
    </>
  );
  const area = (label: string, k: string, rows = 6) => (
    <>
      <label>{label}</label>
      <textarea rows={rows} value={s[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
    </>
  );

  if (!ready) return <main className="st">{css}<p>Loading…</p></main>;
  if (!isAdmin)
    return (
      <main className="st">
        {css}
        <h1>Settings</h1>
        {msg && <div className="msg">{msg}</div>}
        <p>Please log in as admin first.</p>
        <a className="b gold" href="/admin">Go to admin login</a>
      </main>
    );

  return (
    <main className="st">
      {css}
      <h1>Settings</h1>
      <div className="row">
        <a className="b" href="/admin">← Products</a>
        <a className="b" href="/admin/orders">Orders</a>
      </div>
      {msg && <div className="msg">{msg}</div>}

      <div className="card">
        <h2>Store details</h2>
        {text("Store name", "store_name")}
        {area("Store description", "store_description", 3)}
        {text("Contact phone", "contact_phone")}
        {text("WhatsApp number", "whatsapp_number", "Write it like 0300 1234567. It is saved as 923001234567.")}
        {text("Store email", "store_email")}
        {text("Facebook link", "facebook_url", "Starts with https://")}
        {text("Instagram link", "instagram_url", "Starts with https://")}
        {text("TikTok link", "tiktok_url", "Starts with https://")}
        <button className="gold" disabled={busy} onClick={saveStore}>Save store details</button>
      </div>

      <div className="card">
        <h2>Delivery charges</h2>
        <label>Default delivery charge (Rs.)</label>
        <input type="number" inputMode="numeric" value={defCharge} onChange={(e) => setDefCharge(e.target.value)} />
        <label>Free delivery above (Rs., optional)</label>
        <input type="number" inputMode="numeric" value={free} onChange={(e) => setFree(e.target.value)} />
        <small>Leave empty if you do not want free delivery.</small>
        <button className="gold" disabled={busy} onClick={saveDelivery}>Save delivery settings</button>

        <h3 style={{ marginTop: 22 }}>City rates</h3>
        <small>A city rate is used instead of the default charge. Type the city name exactly as customers write it.</small>
        {cities.length === 0 && <p style={{ opacity: 0.7 }}>No city rates yet.</p>}
        {cities.map((c) => (
          <div className="card" key={c.id + c.charge + String(c.is_active)}>
            <strong>{c.city}</strong>
            <label>Charge (Rs.)</label>
            <input type="number" inputMode="numeric" defaultValue={c.charge}
              onBlur={(e) => { const v = Number(e.target.value); if (e.target.value.trim() !== "" && v >= 0 && v !== c.charge) updateCity(c.id, { charge: v }); }} />
            <div className="row">
              <button onClick={() => updateCity(c.id, { is_active: !c.is_active })}>{c.is_active ? "Turn off" : "Turn on"}</button>
              <button className="red" onClick={() => deleteCity(c.id)}>Delete</button>
            </div>
            {!c.is_active && <small>This rate is off. The default charge is used.</small>}
          </div>
        ))}
        <label>New city</label>
        <input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="e.g. Karachi" />
        <label>Charge (Rs.)</label>
        <input type="number" inputMode="numeric" value={newCharge} onChange={(e) => setNewCharge(e.target.value)} />
        <button className="gold" disabled={busy} onClick={addCity}>Add city rate</button>
      </div>

      <div className="card">
        <h2>Policies and pages</h2>
        {area("About us", "about_us")}
        {area("Return and exchange policy", "return_policy")}
        {area("Privacy policy", "privacy_policy")}
        {area("Terms and conditions", "terms_and_conditions")}
        <button className="gold" disabled={busy} onClick={savePolicies}>Save policies</button>
      </div>
    </main>
  );
}
