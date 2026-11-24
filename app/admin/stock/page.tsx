"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/browser";

type P = { id: string; name: string; sku: string; stock: number; low_stock_threshold: number; is_visible: boolean };

function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("The server did not answer. Please try again.")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

export default function AdminStock() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState("");
  const [list, setList] = useState<P[]>([]);
  const [all, setAll] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,sku,stock,low_stock_threshold,is_visible")
      .order("stock", { ascending: true })
      .limit(1000);
    if (error) setMsg(error.message);
    setList((data as P[]) ?? []);
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

  async function change(p: P, field: "stock" | "low_stock_threshold", raw: string) {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isInteger(n) || n < 0) {
      setMsg("Please type a whole number (0 or more).");
      await load();
      return;
    }
    if (n === p[field]) return;
    const { error } = await supabase.from("products").update({ [field]: n }).eq("id", p.id);
    setMsg(error ? error.message : "Updated.");
    await load();
  }

  const shown = all ? list : list.filter((p) => p.stock <= p.low_stock_threshold);

  const css = (
    <style>{`
      .sk{max-width:720px;margin:0 auto;padding:16px;font-family:system-ui,sans-serif;color:#1b2430}
      .sk h1{font-family:Georgia,serif;color:#0b1f3a}
      .sk input{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 10px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
      .sk label{font-weight:600;font-size:.9rem}
      .sk .card{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:10px 0}
      .sk .row{display:flex;gap:8px}.sk .row>*{flex:1}
      .sk .msg{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
      .sk button{min-height:48px;padding:0 20px;border:0;border-radius:999px;background:#0b1f3a;color:#fff;font:inherit;font-weight:600;cursor:pointer;margin-right:8px}
      .sk button.gold{background:#c9a24b;color:#0b1f3a}
      .sk .out{color:#b42318;font-weight:700}.sk .low{color:#b45309;font-weight:700}
    `}</style>
  );

  if (!ready) return <main className="sk">{css}<p>Loading…</p></main>;
  if (!isAdmin)
    return (
      <main className="sk">{css}
        <h1>Stock</h1>
        {msg && <div className="msg">{msg}</div>}
        <p>Please log in as admin first.</p>
        <a href="/admin" style={{ textDecoration: "underline" }}>Go to admin login</a>
      </main>
    );

  return (
    <main className="sk">
      {css}
      <h1>Stock</h1>
      {msg && <div className="msg">{msg}</div>}
      <div>
        <button className={all ? "" : "gold"} onClick={() => setAll(false)}>Low stock</button>
        <button className={all ? "gold" : ""} onClick={() => setAll(true)}>All products</button>
      </div>
      <p style={{ opacity: 0.7 }}>{shown.length} product(s). A product is low when its stock is at or below its alert number.</p>
      {shown.length === 0 && <p style={{ opacity: 0.7 }}>{all ? "No products yet." : "No products are low on stock."}</p>}
      {shown.map((p) => (
        <div className="card" key={p.id + ":" + p.stock + ":" + p.low_stock_threshold}>
          <strong>{p.name}</strong> <small>({p.sku})</small>{!p.is_visible && <em> hidden</em>}
          <div className={p.stock === 0 ? "out" : p.stock <= p.low_stock_threshold ? "low" : ""}>
            {p.stock === 0 ? "Out of stock" : p.stock <= p.low_stock_threshold ? "Low stock" : "In stock"}
          </div>
          <div className="row">
            <div>
              <label>Stock</label>
              <input type="number" inputMode="numeric" defaultValue={p.stock} onBlur={(e) => change(p, "stock", e.target.value)} />
            </div>
            <div>
              <label>Alert at</label>
              <input type="number" inputMode="numeric" defaultValue={p.low_stock_threshold} onBlur={(e) => change(p, "low_stock_threshold", e.target.value)} />
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}
