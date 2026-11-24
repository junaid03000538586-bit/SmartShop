"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";
import { myWishlistId, withTimeout } from "@/lib/wishlist";
import { w, type WL } from "@/lib/wishui";

export default function WishButton({ productId, lang }: { productId: string; lang: WL }) {
  const t = w[lang];
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { wid } = await withTimeout(myWishlistId(false), 15000);
        if (!wid) return;
        const { data } = await withTimeout(
          supabase.from("wishlist_items").select("id").eq("wishlist_id", wid).eq("product_id", productId).maybeSingle(),
          15000
        );
        setSaved(!!data);
      } catch {}
    })();
  }, [productId]);

  async function toggle() {
    if (busy) return;
    setMsg("");
    setBusy(true);
    try {
      const { uid, wid } = await withTimeout(myWishlistId(true), 15000);
      if (!uid) {
        window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
        return;
      }
      if (!wid) throw new Error("no wishlist");
      if (saved) {
        const { error } = await withTimeout(
          supabase.from("wishlist_items").delete().eq("wishlist_id", wid).eq("product_id", productId),
          15000
        );
        if (error) throw error;
        setSaved(false);
      } else {
        const { error } = await withTimeout(
          supabase.from("wishlist_items").insert({ wishlist_id: wid, product_id: productId }),
          15000
        );
        if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
        setSaved(true);
      }
    } catch {
      setMsg(t.slow);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ margin: "8px 0" }}>
      <style>{`.wishbtn{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 20px;border-radius:999px;border:1px solid #c9a24b;background:#fff;color:#0b1f3a;font:inherit;font-weight:600;cursor:pointer}.wishbtn.on{background:#0b1f3a;color:#c9a24b;border-color:#0b1f3a}.wishbtn:disabled{opacity:.6}`}</style>
      <button type="button" className={"wishbtn" + (saved ? " on" : "")} aria-pressed={saved} disabled={busy} onClick={toggle}>
        <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{saved ? "♥" : "♡"}</span>
        {saved ? t.saved : t.save}
      </button>
      {msg && <p style={{ margin: "8px 0", color: "#8a1c12" }}>{msg}</p>}
    </div>
  );
}
