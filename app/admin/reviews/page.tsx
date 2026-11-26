"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/browser";
import { parseReviews, type Review } from "@/lib/homeui";

function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("The server did not answer. Please try again.")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

export default function AdminReviews() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState("5");
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("store_settings").select("value").eq("key", "testimonials").maybeSingle();
    if (error) setMsg(error.message);
    setList(parseReviews(data?.value));
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

  async function persist(next: Review[]) {
    const { error } = await supabase.from("store_settings").upsert({ key: "testimonials", value: JSON.stringify(next) }, { onConflict: "key" });
    if (error) { setMsg(error.message); return false; }
    setList(next);
    return true;
  }

  async function add() {
    if (name.trim().length < 2) { setMsg("Please type the customer's name."); return; }
    if (text.trim().length < 10) { setMsg("The review is too short."); return; }
    if (list.length >= 12) { setMsg("You can show up to 12 reviews. Delete one first."); return; }
    setBusy(true);
    const ok = await persist([
      { id: crypto.randomUUID(), name: name.trim().slice(0, 40), city: city.trim().slice(0, 30), rating: Number(rating), text: text.trim().slice(0, 300) },
      ...list,
    ]);
    setBusy(false);
    if (ok) { setName(""); setCity(""); setRating("5"); setText(""); setMsg("Review added."); }
  }

  async function del(id: string) {
    if (!confirm("Delete this review?")) return;
    if (await persist(list.filter((r) => r.id !== id))) setMsg("Review deleted.");
  }

  const css = (
    <style>{`
      .rvw{max-width:720px;margin:0 auto;padding:16px;font-family:system-ui,sans-serif;color:#1b2430}
      .rvw h1{font-family:Georgia,serif;color:#0b1f3a}
      .rvw input,.rvw select,.rvw textarea{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 12px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
      .rvw label{font-weight:600;font-size:.9rem}
      .rvw .card{background:#fff;border:1px solid #eceae4;border-radius:16px;padding:14px;margin:14px 0}
      .rvw .msg{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
      .rvw button{min-height:48px;padding:0 20px;border:0;border-radius:999px;background:#c9a24b;color:#0b1f3a;font:inherit;font-weight:700;cursor:pointer}
      .rvw button.red{background:#b42318;color:#fff}
      .rvw button:disabled{opacity:.5}
    `}</style>
  );

  if (!ready) return <main className="rvw">{css}<p>Loading…</p></main>;
  if (!isAdmin)
    return (
      <main className="rvw">{css}
        <h1>Reviews</h1>
        {msg && <div className="msg">{msg}</div>}
        <p>Please log in as admin first.</p>
        <a href="/admin" style={{ textDecoration: "underline" }}>Go to admin login</a>
      </main>
    );

  return (
    <main className="rvw">
      {css}
      <h1>Customer reviews</h1>
      <div className="msg">Only add real feedback that a customer gave you, and ask for their permission first. Do not write reviews yourself.</div>
      {msg && <div className="msg">{msg}</div>}

      <div className="card">
        <h2>Add a review</h2>
        <label>Customer name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <label>City (optional)</label>
        <input value={city} onChange={(e) => setCity(e.target.value)} />
        <label>Stars</label>
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          {["5", "4", "3", "2", "1"].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <label>What the customer said</label>
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        <button disabled={busy} onClick={add}>{busy ? "Please wait…" : "Add review"}</button>
      </div>

      <h2>Shown on homepage ({list.length})</h2>
      {list.length === 0 && <p style={{ opacity: 0.7 }}>No reviews yet. The reviews section stays hidden until you add one.</p>}
      {list.map((r) => (
        <div className="card" key={r.id}>
          <strong>{r.name}</strong>{r.city ? ` · ${r.city}` : ""} · {"★".repeat(r.rating)}
          <p>{r.text}</p>
          <button className="red" onClick={() => del(r.id)}>Delete</button>
        </div>
      ))}
    </main>
  );
}
