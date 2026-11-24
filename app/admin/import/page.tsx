"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";

type Cat = { id: string; name: string };
type Row = {
  name: string; sku: string; category_id: string | null; price: number; original_price: number | null;
  stock: number; sizes: string[]; colors: string[]; description: string | null;
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

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
const list = (s: string) => s.split(/[|;,]/).map((x) => x.trim()).filter(Boolean);

const SAMPLE = `name,sku,category,price,original_price,stock,sizes,colors,description
Black Leather Watch,W-101,Watches,2500,3000,10,,Black|Brown,Genuine leather strap
Cotton Bed Sheet,B-201,Bed Sheets,3200,,6,Single|Double,White|Blue,100% cotton`;

export default function AdminImport() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [cats, setCats] = useState<Cat[]>([]);
  const [skus, setSkus] = useState<string[]>([]);
  const [ok, setOk] = useState<Row[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [warns, setWarns] = useState<string[]>([]);
  const [hide, setHide] = useState(true);
  const [fileKey, setFileKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data: s } = await withTimeout(supabase.auth.getSession(), 15000);
        if (s.session) {
          const { data, error } = await withTimeout(supabase.rpc("is_admin"), 15000);
          if (error) setMsg(error.message);
          setIsAdmin(data === true);
          if (data === true) {
            const c = await supabase.from("categories").select("id,name");
            setCats((c.data as Cat[]) ?? []);
            const p = await supabase.from("products").select("sku").limit(5000);
            setSkus(((p.data ?? []) as { sku: string }[]).map((r) => r.sku.toLowerCase()));
          }
        }
      } catch (e) {
        setMsg((e as Error).message);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  async function pick(file: File | null) {
    setOk([]); setSkipped([]); setWarns([]); setMsg("");
    if (!file) return;
    let text = "";
    try {
      text = (await file.text()).replace(/^\uFEFF/, "");
    } catch {
      setMsg("Could not read this file."); return;
    }
    const rows = parseCsv(text);
    if (rows.length < 2) { setMsg("The file has no product rows."); return; }
    if (rows.length > 501) { setMsg("Maximum 500 products at a time. Please split the file."); return; }
    const head = rows[0].map((h) => h.trim().toLowerCase());
    const col = (n: string) => head.indexOf(n);
    if (col("name") < 0 || col("sku") < 0 || col("price") < 0) {
      setMsg("The first row must have the headings name, sku and price. See the example below.");
      return;
    }
    const taken = new Set(skus);
    const good: Row[] = [];
    const bad: string[] = [];
    const warn: string[] = [];
    rows.slice(1).forEach((r, i) => {
      const line = i + 2;
      const get = (n: string) => { const c = col(n); return c >= 0 ? (r[c] ?? "").trim() : ""; };
      const name = get("name");
      const sku = get("sku");
      if (!name || !sku) { bad.push(`Line ${line}: name or sku is empty`); return; }
      if (taken.has(sku.toLowerCase())) { bad.push(`Line ${line}: sku ${sku} already exists or is repeated`); return; }
      const priceRaw = get("price").replace(/,/g, "");
      const price = Number(priceRaw);
      if (priceRaw === "" || !(price >= 0)) { bad.push(`Line ${line}: price is not a number`); return; }
      const stockRaw = get("stock");
      const stock = stockRaw === "" ? 0 : Number(stockRaw);
      if (!Number.isInteger(stock) || stock < 0) { bad.push(`Line ${line}: stock must be a whole number`); return; }
      const oldRaw = get("original_price").replace(/,/g, "");
      const old = oldRaw === "" ? null : Number(oldRaw);
      if (old !== null && !(old >= 0)) { bad.push(`Line ${line}: original_price is not a number`); return; }
      const catName = get("category");
      let category_id: string | null = null;
      if (catName) {
        const hit = cats.find((c) => c.name.toLowerCase() === catName.toLowerCase());
        if (hit) category_id = hit.id; else warn.push(`Line ${line}: category "${catName}" not found, left empty`);
      }
      taken.add(sku.toLowerCase());
      good.push({
        name, sku, category_id, price, original_price: old, stock,
        sizes: list(get("sizes")), colors: list(get("colors")), description: get("description") || null,
      });
    });
    setOk(good); setSkipped(bad); setWarns(warn);
    if (good.length === 0) setMsg("No valid products found in this file.");
  }

  async function run() {
    if (ok.length === 0 || busy) return;
    setBusy(true); setMsg("Importing…");
    let done = 0;
    try {
      for (let i = 0; i < ok.length; i += 50) {
        const chunk = ok.slice(i, i + 50).map((r, j) => ({
          name: r.name, sku: r.sku,
          slug: slugify(r.name) + "-" + Date.now().toString(36) + (i + j).toString(36),
          category_id: r.category_id, description: r.description, price: r.price,
          original_price: r.original_price, stock: r.stock, sizes: r.sizes, colors: r.colors,
          source: "csv", is_visible: !hide,
        }));
        const { error } = await supabase.from("products").insert(chunk);
        if (error) throw error;
        done += chunk.length;
      }
      setMsg(`${done} product(s) imported. Open Products and tap Edit to add photos${hide ? ", then Show them" : ""}.`);
      setSkus((s) => [...s, ...ok.map((r) => r.sku.toLowerCase())]);
      setOk([]); setSkipped([]); setWarns([]); setFileKey((n) => n + 1);
    } catch (e) {
      setMsg(`Stopped after ${done} product(s): ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const css = (
    <style>{`
      .im{max-width:720px;margin:0 auto;padding:16px;font-family:system-ui,sans-serif;color:#1b2430}
      .im h1{font-family:Georgia,serif;color:#0b1f3a}
      .im .card{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:14px 0}
      .im .msg{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
      .im input[type=file]{width:100%;margin:8px 0 12px}
      .im button{min-height:48px;padding:0 20px;border:0;border-radius:999px;background:#c9a24b;color:#0b1f3a;font:inherit;font-weight:700;cursor:pointer}
      .im button:disabled{opacity:.5}
      .im pre{white-space:pre-wrap;word-break:break-word;background:#f4f2ec;border-radius:12px;padding:10px;font-size:.82rem}
      .im .chk{display:flex;align-items:center;gap:8px;min-height:44px}
      .im .chk input{width:24px;height:24px;margin:0}
      .im ul{padding-inline-start:20px;margin:6px 0}
    `}</style>
  );

  if (!ready) return <main className="im">{css}<p>Loading…</p></main>;
  if (!isAdmin)
    return (
      <main className="im">{css}
        <h1>Import products</h1>
        {msg && <div className="msg">{msg}</div>}
        <p>Please log in as admin first.</p>
        <a href="/admin" style={{ textDecoration: "underline" }}>Go to admin login</a>
      </main>
    );

  return (
    <main className="im">
      {css}
      <h1>Import products</h1>
      {msg && <div className="msg">{msg}</div>}

      <div className="card">
        <strong>1. Choose your CSV file</strong>
        <input key={fileKey} type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <p style={{ opacity: 0.7, margin: 0 }}>Photos are not imported. Add them later with Edit on the Products page.</p>
      </div>

      {(ok.length > 0 || skipped.length > 0) && (
        <div className="card">
          <strong>2. Check and import</strong>
          <p>{ok.length} product(s) ready. {skipped.length} row(s) skipped.</p>
          {warns.length > 0 && (<><strong>Notes</strong><ul>{warns.slice(0, 15).map((w) => <li key={w}>{w}</li>)}</ul></>)}
          {skipped.length > 0 && (<><strong>Skipped rows</strong><ul>{skipped.slice(0, 15).map((w) => <li key={w}>{w}</li>)}</ul></>)}
          {(warns.length > 15 || skipped.length > 15) && <p style={{ opacity: 0.7 }}>Only the first 15 are shown.</p>}
          <div className="chk"><input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} />Keep them hidden until I add photos</div>
          <button disabled={busy || ok.length === 0} onClick={run}>{busy ? "Please wait…" : `Import ${ok.length} product(s)`}</button>
        </div>
      )}

      <div className="card">
        <strong>How to make the file</strong>
        <p>Make a sheet in Google Sheets or Excel with these headings in the first row, then download it as CSV.</p>
        <p>Required: <b>name</b>, <b>sku</b>, <b>price</b>. Optional: category, original_price, stock, sizes, colors, description. Separate several sizes or colors with | (for example Black|Brown). Category must match a category name exactly.</p>
        <pre>{SAMPLE}</pre>
      </div>
    </main>
  );
}
