"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/browser";

type Banner = {
  id: string; title: string | null; subtitle: string | null; title_ro: string | null; subtitle_ro: string | null;
  title_ur: string | null; subtitle_ur: string | null; button_text: string | null; link_url: string | null;
  image_url: string | null; sort_order: number; is_active: boolean;
};
type Form = {
  id: string | null; title: string; subtitle: string; title_ro: string; subtitle_ro: string; title_ur: string;
  subtitle_ur: string; button_text: string; link_url: string; sort_order: string; is_active: boolean; image_url: string;
};
const EMPTY: Form = {
  id: null, title: "", subtitle: "", title_ro: "", subtitle_ro: "", title_ur: "", subtitle_ur: "",
  button_text: "", link_url: "", sort_order: "0", is_active: true, image_url: "",
};

function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("The server did not answer. Please try again.")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Image error"))), "image/jpeg", 0.82));
}

const pathFromUrl = (u: string | null) => {
  const part = (u ?? "").split("/product-images/")[1];
  return part ? decodeURIComponent(part.split("?")[0]) : null;
};
const nz = (s: string) => (s.trim() === "" ? null : s.trim());

export default function AdminBanners() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Banner[]>([]);
  const [f, setF] = useState<Form>(EMPTY);
  const [orig, setOrig] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("banners").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) setMsg(error.message);
    setList((data as Banner[]) ?? []);
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

  const set = (k: keyof Form, v: string | boolean) => setF((o) => ({ ...o, [k]: v }));

  function reset() {
    setF(EMPTY); setOrig(null); setFile(null); setFileKey((n) => n + 1);
  }

  function edit(b: Banner) {
    setF({
      id: b.id, title: b.title ?? "", subtitle: b.subtitle ?? "", title_ro: b.title_ro ?? "", subtitle_ro: b.subtitle_ro ?? "",
      title_ur: b.title_ur ?? "", subtitle_ur: b.subtitle_ur ?? "", button_text: b.button_text ?? "", link_url: b.link_url ?? "",
      sort_order: String(b.sort_order), is_active: b.is_active, image_url: b.image_url ?? "",
    });
    setOrig(b.image_url); setFile(null); setFileKey((n) => n + 1); setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeImage(url: string | null) {
    const p = pathFromUrl(url);
    if (p) await supabase.storage.from("product-images").remove([p]);
  }

  async function save() {
    const link = f.link_url.trim();
    if (link && !((link.startsWith("/") && !link.startsWith("//")) || /^https:\/\//i.test(link))) {
      setMsg("Link must start with / (for example /search) or https://"); return;
    }
    if (!f.title.trim() && !f.image_url && !file) { setMsg("Please add a title or a photo."); return; }
    setBusy(true); setMsg("Saving…");
    try {
      let image = f.image_url;
      if (file) {
        const blob = await shrink(file);
        const path = `banners/${Date.now()}.jpg`;
        const up = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        image = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }
      const row = {
        title: nz(f.title), subtitle: nz(f.subtitle), title_ro: nz(f.title_ro), subtitle_ro: nz(f.subtitle_ro),
        title_ur: nz(f.title_ur), subtitle_ur: nz(f.subtitle_ur), button_text: nz(f.button_text), link_url: nz(link),
        image_url: image || null, sort_order: Number(f.sort_order) || 0, is_active: f.is_active,
      };
      const res = f.id ? await supabase.from("banners").update(row).eq("id", f.id) : await supabase.from("banners").insert(row);
      if (res.error) throw res.error;
      if (orig && orig !== (image || null)) await removeImage(orig);
      reset();
      setMsg("Banner saved.");
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(b: Banner) {
    const { error } = await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
    setMsg(error ? error.message : "Updated.");
    await load();
  }

  async function del(b: Banner) {
    if (!confirm("Delete this banner?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", b.id);
    if (error) { setMsg(error.message); return; }
    await removeImage(b.image_url);
    if (f.id === b.id) reset();
    setMsg("Banner deleted.");
    await load();
  }

  const css = (
    <style>{`
      .bm{max-width:720px;margin:0 auto;padding:16px;font-family:system-ui,sans-serif;color:#1b2430}
      .bm h1{font-family:Georgia,serif;color:#0b1f3a}
      .bm input[type=text],.bm input[type=number],.bm textarea{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 12px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
      .bm input[type=file]{width:100%;margin:6px 0 12px}
      .bm label{font-weight:600;font-size:.9rem}
      .bm small{display:block;opacity:.7;margin:-6px 0 12px}
      .bm button{min-height:48px;padding:0 20px;border:0;border-radius:999px;background:#0b1f3a;color:#fff;font:inherit;font-weight:600;cursor:pointer}
      .bm .gold{background:#c9a24b;color:#0b1f3a}.bm .red{background:#b42318}.bm .grey{background:#6b7280}
      .bm button:disabled{opacity:.5}
      .bm .card{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:14px 0}
      .bm .row{display:flex;gap:8px;flex-wrap:wrap}.bm .row>*{flex:1}
      .bm .msg{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
      .bm .chk{display:flex;align-items:center;gap:8px;min-height:44px}
      .bm .chk input{width:24px;height:24px;margin:0}
      .bm img.pv{width:100%;max-height:180px;object-fit:cover;border-radius:12px;display:block;margin:8px 0}
    `}</style>
  );

  if (!ready) return <main className="bm">{css}<p>Loading…</p></main>;
  if (!isAdmin)
    return (
      <main className="bm">{css}
        <h1>Banners</h1>
        {msg && <div className="msg">{msg}</div>}
        <p>Please log in as admin first.</p>
        <a href="/admin" style={{ textDecoration: "underline" }}>Go to admin login</a>
      </main>
    );

  const text = (label: string, k: keyof Form, hint?: string) => (
    <>
      <label>{label}</label>
      <input type="text" value={String(f[k])} onChange={(e) => set(k, e.target.value)} />
      {hint && <small>{hint}</small>}
    </>
  );

  return (
    <main className="bm">
      {css}
      <h1>Banners</h1>
      {msg && <div className="msg">{msg}</div>}

      <div className="card">
        <h2>{f.id ? "Edit banner" : "Add banner"}</h2>
        {text("Title (English)", "title")}
        {text("Subtitle (English)", "subtitle")}
        {text("Title (Roman Urdu, optional)", "title_ro")}
        {text("Subtitle (Roman Urdu, optional)", "subtitle_ro")}
        {text("Title (Urdu, optional)", "title_ur")}
        {text("Subtitle (Urdu, optional)", "subtitle_ur")}
        {text("Button text (optional)", "button_text", "The same text is shown in all languages.")}
        {text("Button link (optional)", "link_url", "Example: /search?sort=low or /category/watches")}
        <label>Order number</label>
        <input type="number" inputMode="numeric" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
        <small>Smaller number shows first.</small>
        {f.image_url && !file && (
          <>
            <img className="pv" src={f.image_url} alt="" />
            <button type="button" className="red" onClick={() => set("image_url", "")}>Remove photo</button>
          </>
        )}
        <label>Photo (optional, a wide photo works best)</label>
        <input key={fileKey} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <div className="chk"><input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} />Show on homepage</div>
        <div className="row">
          <button className="gold" disabled={busy} onClick={save}>{busy ? "Please wait…" : "Save banner"}</button>
          {(f.id || f.title || file) && <button className="grey" disabled={busy} onClick={reset}>Cancel</button>}
        </div>
      </div>

      <h2>Your banners ({list.length})</h2>
      {list.length === 0 && <p style={{ opacity: 0.7 }}>No banners yet. The default welcome section is shown on the homepage.</p>}
      {list.map((b) => (
        <div className="card" key={b.id}>
          {b.image_url && <img className="pv" src={b.image_url} alt="" />}
          <strong>{b.title || "(photo only)"}</strong>
          <div style={{ opacity: 0.7 }}>Order {b.sort_order} · {b.is_active ? "Showing" : "Hidden"}</div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="gold" onClick={() => edit(b)}>Edit</button>
            <button onClick={() => toggle(b)}>{b.is_active ? "Hide" : "Show"}</button>
            <button className="red" onClick={() => del(b)}>Delete</button>
          </div>
        </div>
      ))}
    </main>
  );
}
