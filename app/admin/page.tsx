"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/browser";

type Cat = { id: string; name: string };
type Prod = { id: string; sku: string; name: string; price: number; stock: number; is_visible: boolean };

async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("Image error"))), "image/jpeg", 0.82)
  );
}
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function Admin() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [cats, setCats] = useState<Cat[]>([]);
  const [prods, setProds] = useState<Prod[]>([]);
  const [f, setF] = useState({ name: "", sku: "", cat: "", price: "", old: "", stock: "", sizes: "", colors: "", desc: "", feat: false, isNew: false, best: false });
  const [files, setFiles] = useState<File[]>([]);
  const [fileKey, setFileKey] = useState(0);

  const load = useCallback(async () => {
    const c = await supabase.from("categories").select("id,name").order("sort_order");
    const p = await supabase.from("products").select("id,sku,name,price,stock,is_visible").order("created_at", { ascending: false });
    setCats(c.data ?? []);
    setProds((p.data as Prod[]) ?? []);
  }, []);

  const check = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) { setReady(true); return; }
    const { data } = await supabase.rpc("is_admin");
    setIsAdmin(data === true);
    if (data === true) await load();
    else setMsg("This account is not an admin.");
    setReady(true);
  }, [load]);

  useEffect(() => { check(); }, [check]);

  async function login() {
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else await check();
    setBusy(false);
  }
  async function logout() {
    await supabase.auth.signOut();
    setIsAdmin(false); setProds([]); setMsg("");
  }

  async function addProduct() {
    if (!f.name || !f.sku || !f.price) { setMsg("Name, SKU and price are required."); return; }
    setBusy(true); setMsg("Saving…");
    const { data, error } = await supabase.from("products").insert({
      name: f.name.trim(), sku: f.sku.trim(),
      slug: slugify(f.name) + "-" + Date.now().toString(36),
      category_id: f.cat || null, description: f.desc || null,
      price: Number(f.price), original_price: f.old ? Number(f.old) : null,
      stock: Number(f.stock || 0), sizes: list(f.sizes), colors: list(f.colors),
      is_featured: f.feat, is_new_arrival: f.isNew, is_best_seller: f.best,
    }).select("id").single();
    if (error || !data) { setMsg(error?.message ?? "Could not save."); setBusy(false); return; }
    for (let i = 0; i < files.length; i++) {
      try {
        const blob = await shrink(files[i]);
        const path = `${data.id}/${Date.now()}-${i}.jpg`;
        const up = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        const url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
        await supabase.from("product_images").insert({ product_id: data.id, url, storage_path: path, sort_order: i });
      } catch (e) { setMsg("Product saved, but image " + (i + 1) + " failed: " + (e as Error).message); }
    }
    setF({ name: "", sku: "", cat: "", price: "", old: "", stock: "", sizes: "", colors: "", desc: "", feat: false, isNew: false, best: false });
    setFiles([]); setFileKey((k) => k + 1); setBusy(false);
    setMsg((m) => (m.startsWith("Product saved") ? m : "Product added."));
    await load();
  }
  async function update(id: string, patch: Partial<Prod>) {
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    setMsg(error ? error.message : "Updated.");
    await load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this product permanently?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    setMsg(error ? error.message : "Deleted.");
    await load();
  }

  const set = (k: string, v: string | boolean) => setF({ ...f, [k]: v });

  return (
    <main className="adm">
      <style>{`
        .adm{max-width:720px;margin:0 auto;padding:16px;font-family:system-ui,sans-serif;color:#1b2430}
        .adm h1{font-family:Georgia,serif;color:#0b1f3a}
        .adm input,.adm select,.adm textarea{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 12px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
        .adm label{font-weight:600;font-size:.9rem}
        .adm button{min-height:48px;padding:0 20px;border:0;border-radius:999px;background:#0b1f3a;color:#fff;font:inherit;font-weight:600}
        .adm button.gold{background:#c9a24b;color:#0b1f3a}
        .adm button.red{background:#b42318}
        .adm button:disabled{opacity:.5}
        .adm .card{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:12px 0}
        .adm .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .adm .row>*{flex:1}
        .adm .chk{display:flex;align-items:center;gap:8px;min-height:44px}
        .adm .chk input{width:24px;min-height:24px;margin:0}
        .adm .msg{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
        .adm a.ord{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:999px;background:#c9a24b;color:#0b1f3a;font-weight:600;text-decoration:none}
      `}</style>
      <h1>Smart Shop Admin</h1>
      {msg && <div className="msg">{msg}</div>}
      {!ready && <p>Loading…</p>}

      {ready && !isAdmin && (
        <div className="card">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <button className="gold" disabled={busy} onClick={login}>Log in</button>
        </div>
      )}

      {ready && isAdmin && (
        <>
          <div className="row">
            <button onClick={logout}>Log out</button>
            <a className="ord" href="/admin/orders">Orders</a>
          </div>
          <div className="card">
            <h2>Add product</h2>
            <label>Product name</label>
            <input value={f.name} onChange={(e) => set("name", e.target.value)} />
            <label>SKU (unique ID)</label>
            <input value={f.sku} onChange={(e) => set("sku", e.target.value)} />
            <label>Category</label>
            <select value={f.cat} onChange={(e) => set("cat", e.target.value)}>
              <option value="">Choose…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="row">
              <div><label>Price (Rs.)</label><input type="number" inputMode="numeric" value={f.price} onChange={(e) => set("price", e.target.value)} /></div>
              <div><label>Old price (optional)</label><input type="number" inputMode="numeric" value={f.old} onChange={(e) => set("old", e.target.value)} /></div>
              <div><label>Stock</label><input type="number" inputMode="numeric" value={f.stock} onChange={(e) => set("stock", e.target.value)} /></div>
            </div>
            <label>Sizes (comma separated, e.g. S, M, L)</label>
            <input value={f.sizes} onChange={(e) => set("sizes", e.target.value)} />
            <label>Colors (comma separated)</label>
            <input value={f.colors} onChange={(e) => set("colors", e.target.value)} />
            <label>Description</label>
            <textarea rows={3} value={f.desc} onChange={(e) => set("desc", e.target.value)} />
            <div className="chk"><input type="checkbox" checked={f.feat} onChange={(e) => set("feat", e.target.checked)} />Featured</div>
            <div className="chk"><input type="checkbox" checked={f.isNew} onChange={(e) => set("isNew", e.target.checked)} />New arrival</div>
            <div className="chk"><input type="checkbox" checked={f.best} onChange={(e) => set("best", e.target.checked)} />Best seller</div>
            <label>Photos (choose from gallery)</label>
            <input key={fileKey} type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
            {files.length > 0 && <p>{files.length} photo(s) selected</p>}
            <button className="gold" disabled={busy} onClick={addProduct}>{busy ? "Please wait…" : "Save product"}</button>
          </div>

          <h2>Products ({prods.length})</h2>
          {prods.map((p) => (
            <div className="card" key={p.id + p.price + p.stock}>
              <strong>{p.name}</strong> <small>({p.sku})</small>{!p.is_visible && <em> hidden</em>}
              <div className="row">
                <div><label>Price</label><input type="number" inputMode="numeric" defaultValue={p.price} onBlur={(e) => Number(e.target.value) !== p.price && update(p.id, { price: Number(e.target.value) })} /></div>
                <div><label>Stock</label><input type="number" inputMode="numeric" defaultValue={p.stock} onBlur={(e) => Number(e.target.value) !== p.stock && update(p.id, { stock: Number(e.target.value) })} /></div>
              </div>
              <div className="row">
                <button onClick={() => update(p.id, { is_visible: !p.is_visible })}>{p.is_visible ? "Hide" : "Show"}</button>
                <button className="red" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </>
      )}
    </main>
  );
}
