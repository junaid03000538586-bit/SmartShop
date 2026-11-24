"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/browser";
import { ad, type AdL } from "@/lib/addrui";

type Addr = {
  id: string; label: string | null; full_name: string; phone: string; city: string;
  address_line: string; postal_code: string | null; is_default: boolean;
};
type Form = { id: string | null; label: string; name: string; phone: string; city: string; address: string; postal: string; def: boolean };
const EMPTY: Form = { id: null, label: "", name: "", phone: "", city: "", address: "", postal: "", def: false };

function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

export default function AddressBook({ lang }: { lang: AdL }) {
  const t = ad[lang];
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [list, setList] = useState<Addr[]>([]);
  const [f, setF] = useState<Form | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (u: string) => {
    const { data, error } = await withTimeout(
      supabase
        .from("customer_addresses")
        .select("id,label,full_name,phone,city,address_line,postal_code,is_default")
        .eq("user_id", u)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false }),
      15000
    );
    if (error) throw error;
    setList((data as Addr[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: s } = await withTimeout(supabase.auth.getSession(), 15000);
        const u = s.session?.user.id ?? null;
        setUid(u);
        if (u) await load(u);
      } catch {
        setErr(t.slow);
        setUid((x) => (x === undefined ? null : x));
      }
    })();
  }, [load, t.slow]);

  function open(a?: Addr) {
    setMsg(""); setErr("");
    setF(a ? {
      id: a.id, label: a.label ?? "", name: a.full_name, phone: a.phone, city: a.city,
      address: a.address_line, postal: a.postal_code ?? "", def: a.is_default,
    } : { ...EMPTY });
  }

  async function save() {
    if (!f || !uid) return;
    setErr(""); setMsg("");
    if (f.name.trim().length < 2) return setErr(t.nameBad);
    if (f.phone.replace(/\D/g, "").length < 10) return setErr(t.phoneBad);
    if (f.city.trim().length < 2) return setErr(t.cityBad);
    if (f.address.trim().length < 10) return setErr(t.addrBad);
    setBusy(true);
    try {
      const makeDefault = f.def || (list.length === 0 && !f.id);
      if (makeDefault) {
        await withTimeout(supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", uid), 15000);
      }
      const row = {
        label: f.label.trim() || null, full_name: f.name.trim(), phone: f.phone.trim(), city: f.city.trim(),
        address_line: f.address.trim(), postal_code: f.postal.trim() || null,
        ...(makeDefault ? { is_default: true } : f.id ? {} : { is_default: false }),
      };
      const res = f.id
        ? await withTimeout(supabase.from("customer_addresses").update(row).eq("id", f.id), 15000)
        : await withTimeout(supabase.from("customer_addresses").insert({ ...row, user_id: uid }), 15000);
      if (res.error) throw res.error;
      setF(null);
      await load(uid);
      setMsg(t.saved);
    } catch (e) {
      const m = (e as Error).message;
      setErr(m === "timeout" ? t.slow : m);
      await load(uid).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  async function makeDefault(a: Addr) {
    if (!uid) return;
    setErr(""); setMsg("");
    try {
      await withTimeout(supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", uid), 15000);
      const { error } = await withTimeout(supabase.from("customer_addresses").update({ is_default: true }).eq("id", a.id), 15000);
      if (error) throw error;
    } catch {
      setErr(t.slow);
    }
    await load(uid).catch(() => {});
  }

  async function remove(a: Addr) {
    if (!uid || !confirm(t.confirmDel)) return;
    setErr(""); setMsg("");
    try {
      const { error } = await withTimeout(supabase.from("customer_addresses").delete().eq("id", a.id), 15000);
      if (error) throw error;
      const rest = list.filter((x) => x.id !== a.id);
      if (a.is_default && rest.length > 0) {
        await withTimeout(supabase.from("customer_addresses").update({ is_default: true }).eq("id", rest[0].id), 15000);
      }
      setMsg(t.deleted);
    } catch {
      setErr(t.slow);
    }
    await load(uid).catch(() => {});
  }

  if (!uid) return null;

  const set = (k: keyof Form, v: string | boolean) => setF((o) => (o ? { ...o, [k]: v } : o));

  return (
    <section className="wrap ab" style={{ maxWidth: 560 }}>
      <style>{`
        .ab input[type=text],.ab input[type=tel]{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 12px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
        .ab textarea{width:100%;min-height:80px;padding:10px 14px;margin:6px 0 12px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
        .ab label{font-weight:600;font-size:.9rem}
        .ab .box{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:12px 0}
        .ab .btn2{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:0;border-radius:999px;background:#0b1f3a;color:#fff;font:inherit;font-weight:600;cursor:pointer;margin:6px 8px 0 0}
        .ab .gold{background:#c9a24b;color:#0b1f3a}.ab .red{background:#b42318}.ab .grey{background:#6b7280}
        .ab .btn2:disabled{opacity:.5}
        .ab .tag{display:inline-block;padding:2px 10px;border-radius:999px;background:#c9a24b;color:#0b1f3a;font-size:.8rem;font-weight:700;margin-inline-start:8px}
        .ab .chk{display:flex;align-items:center;gap:8px;min-height:44px}
        .ab .chk input{width:24px;height:24px;margin:0}
        .ab .note{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
        .ab .bad{background:#fde8e6;color:#8a1c12;border-radius:12px;padding:10px 14px;margin:12px 0}
      `}</style>
      <h3>{t.title}</h3>
      {msg && <div className="note">{msg}</div>}
      {err && <div className="bad">{err}</div>}

      {list.length === 0 && !f && <p className="muted">{t.none}</p>}
      {list.map((a) => (
        <div className="box" key={a.id}>
          <strong>{a.label || a.city}</strong>
          {a.is_default && <span className="tag">{t.defTag}</span>}
          <div>{a.full_name} · {a.phone}</div>
          <div className="muted">{a.address_line}, {a.city}{a.postal_code ? ` · ${a.postal_code}` : ""}</div>
          <button className="btn2 gold" onClick={() => open(a)}>{t.edit}</button>
          {!a.is_default && <button className="btn2" onClick={() => makeDefault(a)}>{t.makeDef}</button>}
          <button className="btn2 red" onClick={() => remove(a)}>{t.del}</button>
        </div>
      ))}

      {f ? (
        <div className="box">
          <label>{t.label}</label>
          <input type="text" value={f.label} onChange={(e) => set("label", e.target.value)} />
          <label>{t.name}</label>
          <input type="text" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
          <label>{t.phone}</label>
          <input type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
          <label>{t.city}</label>
          <input type="text" value={f.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" />
          <label>{t.address}</label>
          <textarea value={f.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" />
          <label>{t.postal}</label>
          <input type="text" value={f.postal} onChange={(e) => set("postal", e.target.value)} autoComplete="postal-code" />
          <div className="chk"><input type="checkbox" checked={f.def} onChange={(e) => set("def", e.target.checked)} />{t.def}</div>
          <button className="btn2 gold" disabled={busy} onClick={save}>{busy ? t.saving : t.save}</button>
          <button className="btn2 grey" disabled={busy} onClick={() => setF(null)}>{t.cancel}</button>
        </div>
      ) : (
        <button className="btn2 gold" onClick={() => open()}>{t.add}</button>
      )}
    </section>
  );
}
