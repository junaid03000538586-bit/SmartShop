"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/browser";

const STATUSES = ["new", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
const LABEL: Record<string, string> = {
  new: "New order", confirmed: "Confirmed", processing: "Processing",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};
const COLOR: Record<string, string> = {
  new: "#c9a24b", confirmed: "#2b6cb0", processing: "#6b46c1",
  shipped: "#0e7490", delivered: "#1f8f4e", cancelled: "#b42318",
};

type Order = {
  id: string; order_number: string; status: string; customer_name: string; phone: string;
  whatsapp: string | null; city: string; address: string; postal_code: string | null;
  notes: string | null; payment_method: string; subtotal: number; delivery_charge: number;
  total: number; created_at: string; archived: boolean;
};
type Line = {
  id: string; product_name: string; sku: string | null; quantity: number;
  size: string | null; color: string | null; unit_price: number; line_total: number;
};
type Note = { id: string; note: string; created_at: string };
type Stats = { total: number; nw: number; processing: number; delivered: number; cancelled: number; archived: number; products: number; low: number };

const rs = (n: number) => "Rs. " + Number(n).toLocaleString("en-PK");
const when = (s: string) => new Date(s).toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" });
function waDigits(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("92")) return d;
  if (d.startsWith("0")) return "92" + d.slice(1);
  return d;
}
function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("The server did not answer. Please try again.")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

/* Messages for the WhatsApp status update. Change the wording here if you like. */
function statusMsg(o: Order, store: string, origin: string): string {
  const link = `${origin}/track?o=${encodeURIComponent(o.order_number)}`;
  const head = `Assalam o Alaikum ${o.customer_name}!`;
  const total = rs(o.total);
  const tail = `\n\nOrder ka status yahan dekhein:\n${link}\n(Order number mein ye number aur apna phone number likhein.)`;
  switch (o.status) {
    case "confirmed":
      return `${head} ${store} par aap ka order ${o.order_number} confirm ho gaya hai.\nTotal: ${total} (Cash on Delivery, order milne par payment karein).${tail}`;
    case "processing":
      return `${head} ${store} par aap ka order ${o.order_number} tayyar kiya ja raha hai.${tail}`;
    case "shipped":
      return `${head} ${store} par aap ka order ${o.order_number} rawana kar diya gaya hai. Aam tor par ye 5 se 6 din mein pohanch jata hai.\nTotal: ${total} (Cash on Delivery).${tail}`;
    case "delivered":
      return `${head} aap ka order ${o.order_number} pohanch gaya hai. ${store} se khareedari ka shukriya! Koi masla ho to isi chat mein bata dein.`;
    case "cancelled":
      return `${head} aap ka order ${o.order_number} cancel kar diya gaya hai. Koi sawal ho to isi chat mein bata dein.`;
    default:
      return `${head} ${store} par aap ka order ${o.order_number} humein mil gaya hai. Hum jald confirm karenge.${tail}`;
  }
}

export default function AdminOrders() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<"active" | "archived" | "all">("active");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [store, setStore] = useState("Smart Shop");

  const loadStats = useCallback(async () => {
    const count = async (st?: string, archived?: boolean) => {
      let q = supabase.from("orders").select("id", { count: "exact", head: true });
      if (st) q = q.eq("status", st);
      if (archived !== undefined) q = q.eq("archived", archived);
      const { count: c } = await q;
      return c ?? 0;
    };
    const [total, nw, processing, delivered, cancelled, archived] = await Promise.all([
      count(undefined, false), count("new", false), count("processing", false),
      count("delivered", false), count("cancelled", false), count(undefined, true),
    ]);
    const p = await supabase.from("products").select("stock,low_stock_threshold", { count: "exact" }).limit(1000);
    const low = (p.data ?? []).filter((r: { stock: number; low_stock_threshold: number }) => r.stock <= r.low_stock_threshold).length;
    setStats({ total, nw, processing, delivered, cancelled, archived, products: p.count ?? 0, low });
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
    if (view === "active") q = q.eq("archived", false);
    if (view === "archived") q = q.eq("archived", true);
    if (status) q = q.eq("status", status);
    if (from) q = q.gte("created_at", new Date(from + "T00:00:00+05:00").toISOString());
    if (to) q = q.lt("created_at", new Date(new Date(to + "T00:00:00+05:00").getTime() + 86400000).toISOString());
    const s = search.replace(/[,()%*]/g, "").trim();
    if (s) q = q.or(`order_number.ilike.%${s}%,customer_name.ilike.%${s}%,phone.ilike.%${s}%`);
    const { data, error } = await q;
    if (error) setMsg(error.message);
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, [view, status, from, to, search]);

  useEffect(() => {
    (async () => {
      try {
        const { data: s } = await withTimeout(supabase.auth.getSession(), 15000);
        if (s.session) {
          const { data, error } = await withTimeout(supabase.rpc("is_admin"), 15000);
          if (error) setMsg(error.message);
          setIsAdmin(data === true);
          if (data === true) {
            loadStats();
            const { data: n } = await supabase.from("store_settings").select("value").eq("key", "store_name").maybeSingle();
            if (n?.value && String(n.value).trim()) setStore(String(n.value).trim());
          }
        }
      } catch (e) {
        setMsg((e as Error).message);
      } finally {
        setReady(true);
      }
    })();
  }, [loadStats]);

  useEffect(() => {
    if (!isAdmin) return;
    const id = setTimeout(loadOrders, 300);
    return () => clearTimeout(id);
  }, [isAdmin, loadOrders]);

  async function toggle(o: Order) {
    if (open === o.id) { setOpen(null); return; }
    setOpen(o.id); setLines([]); setNotes([]); setNoteText("");
    const li = await supabase.from("order_items").select("id,product_name,sku,quantity,size,color,unit_price,line_total").eq("order_id", o.id);
    setLines((li.data as Line[]) ?? []);
    const nt = await supabase.from("order_internal_notes").select("id,note,created_at").eq("order_id", o.id).order("created_at", { ascending: false });
    setNotes((nt.data as Note[]) ?? []);
  }

  async function changeStatus(o: Order, next: string) {
    if (next === o.status) return;
    if (next === "cancelled" && !confirm("Cancel this order? Stock will be returned. A cancelled order cannot be reopened.")) return;
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", o.id);
    setMsg(error ? error.message : "Status updated. Now tap “Send status update” to tell the customer on WhatsApp.");
    await loadOrders();
    loadStats();
  }

  async function setArchived(o: Order, value: boolean) {
    const { error } = await supabase.from("orders").update({ archived: value }).eq("id", o.id);
    setMsg(error ? error.message : value ? "Order archived." : "Order moved back to active.");
    setOpen(null);
    await loadOrders();
    loadStats();
  }

  async function archiveFinished() {
    if (!confirm("Archive all delivered and cancelled orders? They will not be deleted. You can still find them under Archived.")) return;
    const { error } = await supabase
      .from("orders")
      .update({ archived: true })
      .in("status", ["delivered", "cancelled"])
      .eq("archived", false);
    setMsg(error ? error.message : "Delivered and cancelled orders were archived.");
    setOpen(null);
    await loadOrders();
    loadStats();
  }

  async function addNote() {
    const text = noteText.trim();
    if (!text || !open) return;
    const { data: s } = await supabase.auth.getSession();
    const { error } = await supabase.from("order_internal_notes").insert({ order_id: open, note: text, created_by: s.session?.user.id });
    if (error) { setMsg(error.message); return; }
    setNoteText("");
    const nt = await supabase.from("order_internal_notes").select("id,note,created_at").eq("order_id", open).order("created_at", { ascending: false });
    setNotes((nt.data as Note[]) ?? []);
  }

  const css = (
    <style>{`
      .ao{max-width:760px;margin:0 auto;padding:16px;font-family:system-ui,sans-serif;color:#1b2430}
      .ao h1{font-family:Georgia,serif;color:#0b1f3a}
      .ao input,.ao select,.ao textarea{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 10px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
      .ao button,.ao a.b{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border:0;border-radius:999px;background:#0b1f3a;color:#fff;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}
      .ao .gold{background:#c9a24b;color:#0b1f3a}.ao .green{background:#1f8f4e}.ao .grey{background:#6b7280}
      .ao .stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin:12px 0}
      .ao .stat{background:#fff;border:1px solid #eceae4;border-radius:14px;padding:10px}
      .ao .stat b{display:block;font-size:1.4rem;color:#0b1f3a}
      .ao .card{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:10px 0}
      .ao .row{display:flex;gap:8px;flex-wrap:wrap}.ao .row>*{flex:1}
      .ao .between{display:flex;justify-content:space-between;gap:8px}
      .ao .pill{display:inline-block;padding:2px 12px;border-radius:999px;color:#fff;font-size:.85rem;font-weight:600}
      .ao .msg{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
      .ao .note{background:#f4f2ec;border-radius:10px;padding:8px 12px;margin:6px 0}
      .ao .muted{opacity:.7}
    `}</style>
  );

  if (!ready) return <main className="ao">{css}<p>Loading…</p></main>;
  if (!isAdmin)
    return (
      <main className="ao">{css}
        <h1>Orders</h1>
        {msg && <div className="msg">{msg}</div>}
        <p>Please log in as admin first.</p>
        <a className="b gold" href="/admin">Go to admin login</a>
      </main>
    );

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className="ao">
      {css}
      <h1>Orders</h1>
      <div className="row">
        <button onClick={() => { loadOrders(); loadStats(); }}>Refresh</button>
        <button className="grey" onClick={archiveFinished}>Archive delivered and cancelled</button>
      </div>
      {msg && <div className="msg">{msg}</div>}

      {stats && (
        <div className="stats">
          <div className="stat"><b>{stats.total}</b>Active orders</div>
          <div className="stat"><b>{stats.nw}</b>New</div>
          <div className="stat"><b>{stats.processing}</b>Processing</div>
          <div className="stat"><b>{stats.delivered}</b>Delivered</div>
          <div className="stat"><b>{stats.cancelled}</b>Cancelled</div>
          <div className="stat"><b>{stats.archived}</b>Archived</div>
          <div className="stat"><b>{stats.products}</b>Products</div>
          <div className="stat"><b>{stats.low}</b>Low stock</div>
        </div>
      )}

      <div className="card">
        <div className="row">
          <button className={view === "active" ? "gold" : ""} onClick={() => setView("active")}>Active</button>
          <button className={view === "archived" ? "gold" : ""} onClick={() => setView("archived")}>Archived</button>
          <button className={view === "all" ? "gold" : ""} onClick={() => setView("all")}>All</button>
        </div>
        <input type="search" style={{ marginTop: 12 }} placeholder="Search order no., name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
        </select>
        <div className="row">
          <div><small>From</small><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><small>To</small><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {!loading && orders.length === 0 && <p className="muted">No orders found.</p>}

      {orders.map((o) => (
        <div className="card" key={o.id}>
          <div onClick={() => toggle(o)} style={{ cursor: "pointer" }}>
            <div className="between">
              <strong>{o.order_number}{o.archived ? " · Archived" : ""}</strong>
              <span className="pill" style={{ background: COLOR[o.status] }}>{LABEL[o.status] ?? o.status}</span>
            </div>
            <div>{o.customer_name} · {o.city}</div>
            <div className="between"><span className="muted">{when(o.created_at)}</span><strong>{rs(o.total)}</strong></div>
          </div>

          {open === o.id && (
            <div style={{ marginTop: 12, borderTop: "1px solid #eceae4", paddingTop: 12 }}>
              <label><strong>Status</strong></label>
              <select value={o.status} onChange={(e) => changeStatus(o, e.target.value)} disabled={o.status === "cancelled"}>
                {STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
              </select>

              <p><strong>Customer</strong><br />{o.customer_name}<br />Phone: {o.phone}<br />WhatsApp: {o.whatsapp ?? o.phone}</p>
              <div className="row">
                <a className="b green" href={`https://wa.me/${waDigits(o.whatsapp ?? o.phone)}?text=${encodeURIComponent(statusMsg(o, store, origin))}`}>Send status update</a>
                <a className="b" href={`https://wa.me/${waDigits(o.whatsapp ?? o.phone)}`}>WhatsApp chat</a>
                <a className="b" href={`tel:${o.phone}`}>Call</a>
              </div>

              <p><strong>Delivery address</strong><br />{o.address}<br />{o.city}{o.postal_code ? ` · ${o.postal_code}` : ""}</p>
              {o.notes && <p><strong>Customer note</strong><br />{o.notes}</p>}

              <strong>Items</strong>
              {lines.map((l) => (
                <div className="between" key={l.id} style={{ margin: "6px 0" }}>
                  <span>{l.product_name}{l.sku ? ` (${l.sku})` : ""}{(l.size || l.color) ? ` · ${[l.size, l.color].filter(Boolean).join(", ")}` : ""} × {l.quantity}</span>
                  <span>{rs(l.line_total)}</span>
                </div>
              ))}
              <hr />
              <div className="between"><span>Subtotal</span><span>{rs(o.subtotal)}</span></div>
              <div className="between"><span>Delivery</span><span>{rs(o.delivery_charge)}</span></div>
              <div className="between"><strong>Total</strong><strong>{rs(o.total)}</strong></div>
              <p className="muted">Payment: Cash on Delivery</p>

              <strong>Internal notes (customer cannot see)</strong>
              <textarea rows={2} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Write a note…" />
              <button className="gold" onClick={addNote}>Add note</button>
              {notes.map((n) => (
                <div className="note" key={n.id}>{n.note}<br /><small className="muted">{when(n.created_at)}</small></div>
              ))}

              <div style={{ marginTop: 16 }}>
                {o.archived
                  ? <button className="grey" onClick={() => setArchived(o, false)}>Move back to active</button>
                  : <button className="grey" onClick={() => setArchived(o, true)}>Archive this order</button>}
              </div>
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
