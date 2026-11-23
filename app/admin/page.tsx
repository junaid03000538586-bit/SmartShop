"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/browser";

type Cat = { id: string; name: string };
type Img = { id: string; url: string; storage_path: string | null; sort_order: number };
type Prod = {
  id: string; sku: string; name: string; category_id: string | null; description: string | null;
  price: number; original_price: number | null; stock: number; sizes: string[] | null; colors: string[] | null;
  is_featured: boolean; is_new_arrival: boolean; is_best_seller: boolean; is_visible: boolean;
  product_images: Img[] | null;
};
type Form = {
  name: string; sku: string; cat: string; price: string; old: string; stock: string;
  sizes: string; colors: string; desc: string; feat: boolean; isNew: boolean; best: boolean;
};

const EMPTY: Form = { name: "", sku: "", cat: "", price: "", old: "", stock: "", sizes: "", colors: "", desc: "", feat: false, isNew: false, best: false };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const toForm = (p: Prod): Form => ({
  name: p.name, sku: p.sku, cat: p.category_id ?? "", price: String(p.price),
  old: p.original_price == null ? "" : String(p.original_price), stock: String(p.stock),
  sizes: (p.sizes ?? []).join(", "), colors: (p.colors ?? []).join(", "), desc: p.description ?? "",
  feat: p.is_featured, isNew: p.is_new_arrival, best: p.is_best_seller,
});
const payload = (f: Form) => ({
  name: f.name.trim(), sku: f.sku.trim(), category_id: f.cat || null, description: f.desc || null,
  price: Number(f.price), original_price: f.old ? Number(f.old) : null, stock: Number(f.stock || 0),
  sizes: list(f.sizes), colors: list(f.colors),
  is_featured: f.feat, is_new_arrival: f.isNew, is_best_seller: f.best,
});

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

async function uploadImages(productId: string, files: File[], start: number): Promise<string> {
  let bad = "";
  for (let i = 0; i < files.length; i++) {
    try {
      const blob = await shrink(files[i]);
      const path = `${productId}/${Date.now()}-${i}.jpg`;
      const up = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      const ins = await supabase.from("product_images").insert({ product_id: productId, url, storage_path: path, sort_order: start + i });
      if (ins.error) throw ins.error;
    } catch (e) {
      bad = "Photo " + (i + 1) + " failed: " + (e as Error).message;
    }
  }
  return bad;
}

function FormFields({ v, set, cats }: { v: Form; set: (k: string, val: string | boolean) => void; cats: Cat[] }) {
  return (
    <>
      <label>Product name</label>
      <input value={v.name} onChange={(e) => set("name", e.target.value)} />
      <label>SKU (unique ID)</label>
      <input value={v.sku} onChange={(e) => set("sku", e.target.value)} />
      <label>Category</label>
      <select value={v.cat} onChange={(e) => set("cat", e.target.value)}>
        <option value="">Choose…</option>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="row">
        <div><label>Price (Rs.)</label><input type="number" inputMode="numeric" value={v.price} onChange={(e) => set("price", e.target.value)} /></div>
        <div><label>Old price (optional)</label><input type="number" inputMode="numeric" value={v.old} onChange={(e) => set("old", e.target.value)} /></div>
        <div><label>Stock</label><input type="number" inputMode="numeric" value={v.stock} onChange={(e) => set("stock", e.target.value)} /></div>
      </div>
      <label>Sizes (comma separated, e.g. S, M, L)</label>
      <input value={v.sizes} onChange={(e) => set("sizes", e.target.value)} />
      <label>Colors (comma separated)</label>
      <input value={v.colors} onChange={(e) => set("colors", e.target.value)} />
      <label>Description</label>
      <textarea rows={3} value={v.desc} onChange={(e) => set("desc", e.target.value)} />
      <div className="chk"><input type="checkbox" checked={v.feat} onChange={(e) => set("feat", e.target.checked)} />Featured</div>
      <div className="chk"><input type="checkbox" checked={v.isNew} onChange={(e) => set("isNew", e.target.checked)} />New arrival</div>
      <div className="chk"><input type="checkbox" checked={v.best} onChange={(e) => set("best", e.target.checked)} />Best seller</div>
    </>
  );
}

export default function Admin() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [cats, setCats] = useState<Cat[]>([]);
  const [prods, setProds] = useState<Prod[]>([]);
  const [f, setF] = useState<Form>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [fileKey, setFileKey] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [ef, setEf] = useState<Form>(EMPTY);
  const [efiles, setEfiles] = useState<File[]>([]);
  const [efileKey, setEfileKey] = useState(0);
  const [remove, setRemove] = useState<string[]>([]);

  const load = useCallback(async () => {
    const c = await supabase.from("categories").select("id,name").order("sort_order");
    const p = await supabase
      .from("products")
      .select("*,product_images(id,url,storage_path,sort_order)")
      .order("created_at", { ascending: false });
    if (p.error) setMsg(p.error.message);
    setCats(c.data ?? []);
    setProds((p.data as Prod[]) ?? []);
  }, []);

  const check = useCallback(async () => {
    try {
      const { data: s } = await supabase.auth.getSession();
      if (s.session) {
        const { data, error } = await supabase.rpc("is_admin");
        if (error) setMsg(error.message);
        setIsAdmin(data === true);
        if (data === true) await load();
        else if (!error) setMsg("This account is not an admin.");
      }
    } catch (e) {
      setMsg("Could not load: " + (e as Error).message);
    } finally {
      setReady(true);
    }
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
    setIsAdmin(false); setProds([]); setMsg(""); setEditId(null);
  }

  async function addProduct() {
    if (!f.name || !f.sku || !f.price) { setMsg("Name, SKU and price are required."); return; }
    setBusy(true); setMsg("Saving…");
    const { data, error } = await supabase
      .from("products")
      .insert({ ...payload(f), slug: slugify(f.name) + "-" + Date.now().toString(36) })
      .select("id")
      .single();
    if (error || !data) { setMsg(error?.message ?? "Could not save."); setBusy(false); return; }
    const bad = await uploadImages(data.id, files, 0);
    setF(EMPTY); setFiles([]); setFileKey((k) => k + 1); setBusy(false);
    setMsg(bad ? "Product saved, but " + bad : "Product added.");
    await load();
  }

  function startEdit(p: Prod) {
    setEditId(p.id); setEf(toForm(p)); setEfiles([]); setRemove([]); setEfileKey((k) => k + 1); setMsg("");
  }

  async function saveEdit(p: Prod) {
    if (!ef.name || !ef.sku || !ef.price) { setMsg("Name, SKU and price are required."); return; }
    setBusy(true); setMsg("Saving…");
    const { error } = await supabase.from("products").update(payload(ef)).eq("id", p.id);
    if (error) { setMsg(error.message); setBusy(false); return; }
    const imgs = p.product_images ?? [];
    for (const id of remove) {
      const im = imgs.find((x) => x.id === id);
      if (im?.storage_path) await supabase.storage.from("product-images").remove([im.storage_path]);
      await supabase.from("product_images").delete().eq("id", id);
    }
    const start = imgs.reduce((m, x) => Math.max(m, x.sort_order), -1) + 1;
    const bad = await uploadImages(p.id, efiles, start);
    setEditId(null); setBusy(false);
    setMsg(bad ? "Product updated, but " + bad : "Product updated.");
    await load();
  }

  async function toggleVisible(p: Prod) {
    const { error } = await supabase.from("products").update({ is_visible: !p.is_visible }).eq("id", p.id);
    setMsg(error ? error.message : "Updated.");
    await load();
  }

  async function removeProduct(p: Prod) {
    if (!confirm("Delete this product permanently?")) return;
    const paths = (p.product_images ?? []).map((i) => i.storage_path).filter((x): x is string => !!x);
    if (paths.length) await supabase.storage.from("product-images").remove(paths);
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    setMsg(error ? error.message : "Deleted.");
    await load();
  }

  const setA = (k: string, v: string | boolean) => setF({ ...f, [k]: v });
  const setE = (k: string, v: string | boolean) => setEf({ ...ef, [k]: v });

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
        .adm button.grey{background:#6b7280}
        .adm button:disabled{opacity:.5}
        .adm .card{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:12px 0}
        .adm .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .adm .row>*{flex:1}
        .adm .chk{display:flex;align-items:center;gap:8px;min-height:44px}
        .adm .chk input{width:24px;min-height:24px;margin:0}
        .adm .msg{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
        .adm a.ord{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:999px;background:#c9a24b;color:#0b1f3a;font-weight:600;text-decoration:none}
        .adm .thumbs{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 12px}
        .adm .thumbs>div{width:92px}
        .adm .thumbs img{width:92px;height:122px;object-fit:cover;border-radius:10px;display:block}
        .adm .thumbs button{width:100%;min-height:44px;padding:0;margin-top:4px;font-size:.85rem}
        .adm .pr{display:flex;justify-content:space-between;gap:8px;margin:6px 0}
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
            <FormFields v={f} set={setA} cats={cats} />
            <label>Photos (choose from gallery)</label>
            <input key={fileKey} type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
            {files.length > 0 && <p>{files.length} photo(s) selected</p>}
            <button className="gold" disabled={busy} onClick={addProduct}>{busy ? "Please wait…" : "Save product"}</button>
          </div>

          <h2>Products ({prods.length})</h2>
          {prods.map((p) => {
            const imgs = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
            return (
              <div className="card" key={p.id}>
                <strong>{p.name}</strong> <small>({p.sku})</small>{!p.is_visible && <em> hidden</em>}
                {editId !== p.id && (
                  <>
                    <div className="pr"><span>Price: Rs. {Number(p.price).toLocaleString("en-PK")}</span><span>Stock: {p.stock}</span></div>
                    <div className="row">
                      <button className="gold" onClick={() => startEdit(p)}>Edit</button>
                      <button onClick={() => toggleVisible(p)}>{p.is_visible ? "Hide" : "Show"}</button>
                      <button className="red" onClick={() => removeProduct(p)}>Delete</button>
                    </div>
                  </>
                )}
                {editId === p.id && (
                  <div style={{ marginTop: 12 }}>
                    <FormFields v={ef} set={setE} cats={cats} />
                    {imgs.length > 0 && (
                      <>
                        <label>Current photos</label>
                        <div className="thumbs">
                          {imgs.map((im) => {
                            const gone = remove.includes(im.id);
                            return (
                              <div key={im.id}>
                                <img src={im.url} alt="" style={{ opacity: gone ? 0.35 : 1 }} />
                                <button type="button" className={gone ? "grey" : "red"} onClick={() => setRemove(gone ? remove.filter((x) => x !== im.id) : [...remove, im.id])}>
                                  {gone ? "Undo" : "Remove"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                    <label>Add more photos</label>
                    <input key={efileKey} type="file" accept="image/*" multiple onChange={(e) => setEfiles(Array.from(e.target.files ?? []))} />
                    {efiles.length > 0 && <p>{efiles.length} photo(s) selected</p>}
                    <div className="row">
                      <button className="gold" disabled={busy} onClick={() => saveEdit(p)}>{busy ? "Please wait…" : "Save changes"}</button>
                      <button className="grey" disabled={busy} onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </main>
  );
}
