"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/browser";

function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("The server did not answer. Please try again.")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

async function shrinkPng(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * scale));
  c.height = Math.max(1, Math.round(bmp.height * scale));
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Image error"))), "image/png"));
}

const pathFromUrl = (u: string) => {
  const part = u.split("/product-images/")[1];
  return part ? decodeURIComponent(part.split("?")[0]) : null;
};

export default function AdminLogo() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [logo, setLogo] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("store_settings").select("key,value").in("key", ["store_logo_url", "store_name"]);
    if (error) { setMsg(error.message); return; }
    for (const r of data ?? []) {
      if (r.key === "store_logo_url") setLogo(r.value ?? "");
      if (r.key === "store_name") setName(r.value ?? "");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: s } = await withTimeout(supabase.auth.getSession(), 15000);
        if (s.session) {
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

  async function save() {
    if (!file) { setMsg("Please choose a logo photo first."); return; }
    setBusy(true); setMsg("Saving…");
    try {
      const blob = await shrinkPng(file);
      const path = `branding/logo-${Date.now()}.png`;
      const up = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/png" });
      if (up.error) throw up.error;
      const url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      const { error } = await supabase.from("store_settings").upsert({ key: "store_logo_url", value: url }, { onConflict: "key" });
      if (error) throw error;
      const old = logo ? pathFromUrl(logo) : null;
      if (old) await supabase.storage.from("product-images").remove([old]);
      setLogo(url); setFile(null); setFileKey((n) => n + 1);
      setMsg("Logo saved. It now shows in the website header.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!logo || !confirm("Remove the logo?")) return;
    setBusy(true);
    const { error } = await supabase.from("store_settings").upsert({ key: "store_logo_url", value: "" }, { onConflict: "key" });
    if (error) { setMsg(error.message); setBusy(false); return; }
    const old = pathFromUrl(logo);
    if (old) await supabase.storage.from("product-images").remove([old]);
    setLogo("");
    setBusy(false);
    setMsg("Logo removed.");
  }

  const css = (
    <style>{`
      .lo{max-width:720px;margin:0 auto;padding:16px;font-family:system-ui,sans-serif;color:#1b2430}
      .lo h1{font-family:Georgia,serif;color:#0b1f3a}
      .lo .card{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:14px 0}
      .lo .msg{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
      .lo input[type=file]{width:100%;margin:8px 0 14px}
      .lo button{min-height:48px;padding:0 20px;border:0;border-radius:999px;background:#c9a24b;color:#0b1f3a;font:inherit;font-weight:700;cursor:pointer;margin-right:8px}
      .lo button.red{background:#b42318;color:#fff}
      .lo button:disabled{opacity:.5}
      .lo .pv{background:#0b1f3a;border-radius:12px;padding:14px;display:flex;align-items:center;gap:10px;color:#c9a24b;font-family:Georgia,serif;font-size:1.3rem}
      .lo .pv img{height:40px;width:auto;max-width:140px;object-fit:contain}
    `}</style>
  );

  if (!ready) return <main className="lo">{css}<p>Loading…</p></main>;
  if (!isAdmin)
    return (
      <main className="lo">{css}
        <h1>Logo</h1>
        {msg && <div className="msg">{msg}</div>}
        <p>Please log in as admin first.</p>
        <a href="/admin" style={{ textDecoration: "underline" }}>Go to admin login</a>
      </main>
    );

  return (
    <main className="lo">
      {css}
      <h1>Logo</h1>
      {msg && <div className="msg">{msg}</div>}
      <div className="card">
        <strong>How it looks in the header</strong>
        <div className="pv" style={{ marginTop: 10 }}>
          {logo && <img src={logo} alt="" />}
          <span>{name || "Smart Shop"}</span>
        </div>
        <p style={{ opacity: 0.7 }}>The store name is changed from Settings, Store details.</p>
      </div>
      <div className="card">
        <label><strong>Choose logo photo</strong></label>
        <input key={fileKey} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <p style={{ opacity: 0.7, marginTop: -6 }}>A square or wide logo works best. A transparent PNG looks best on the dark header.</p>
        <button disabled={busy} onClick={save}>{busy ? "Please wait…" : "Save logo"}</button>
        {logo && <button className="red" disabled={busy} onClick={remove}>Remove logo</button>}
      </div>
    </main>
  );
}
