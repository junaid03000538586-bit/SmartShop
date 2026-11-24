"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";
import { myWishlistId, withTimeout } from "@/lib/wishlist";
import { loadWishSet } from "@/lib/wishset";

export default function HeartBtn({ productId }: { productId: string }) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadWishSet().then((c) => { if (alive) setOn(c.ids.has(productId)); });
    return () => { alive = false; };
  }, [productId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const { uid, wid } = await withTimeout(myWishlistId(true), 15000);
      if (!uid) {
        window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname + window.location.search);
        return;
      }
      if (!wid) throw new Error("no wishlist");
      if (on) {
        const { error } = await withTimeout(
          supabase.from("wishlist_items").delete().eq("wishlist_id", wid).eq("product_id", productId),
          15000
        );
        if (error) throw error;
        setOn(false);
        loadWishSet().then((c) => c.ids.delete(productId));
      } else {
        const { error } = await withTimeout(
          supabase.from("wishlist_items").insert({ wishlist_id: wid, product_id: productId }),
          15000
        );
        if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
        setOn(true);
        loadWishSet().then((c) => c.ids.add(productId));
      }
    } catch {
      /* ignore: the heart simply stays as it was */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-label="Wishlist"
      aria-pressed={on}
      disabled={busy}
      onClick={toggle}
      style={{
        position: "absolute", top: 8, insetInlineEnd: 8, width: 44, height: 44, borderRadius: "50%",
        border: 0, background: "rgba(255,255,255,.92)", color: on ? "#b42318" : "#0b1f3a",
        fontSize: "1.4rem", lineHeight: 1, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,.25)",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {on ? "♥" : "♡"}
    </button>
  );
}
