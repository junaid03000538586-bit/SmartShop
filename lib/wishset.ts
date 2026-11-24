"use client";
import { supabase } from "./browser";
import { myWishlistId, withTimeout } from "./wishlist";

type WishSet = { ids: Set<string> };

let cache: Promise<WishSet> | null = null;

export function loadWishSet(): Promise<WishSet> {
  if (!cache) {
    cache = (async () => {
      const ids = new Set<string>();
      try {
        const { wid } = await withTimeout(myWishlistId(false), 15000);
        if (wid) {
          const { data } = await withTimeout(
            supabase.from("wishlist_items").select("product_id").eq("wishlist_id", wid),
            15000
          );
          (data ?? []).forEach((r: { product_id: string }) => ids.add(r.product_id));
        }
      } catch {
        cache = null;
      }
      return { ids };
    })();
  }
  return cache;
}
