"use client";
import { useEffect, useState } from "react";
import { supabase } from "./browser";

export type Item = {
  productId: string; slug: string; name: string; price: number; image: string | null;
  size: string | null; color: string | null; qty: number; stock: number;
};

const KEY = "ss_cart_v1";
export const itemKey = (i: Pick<Item, "productId" | "size" | "color">) => `${i.productId}|${i.size ?? ""}|${i.color ?? ""}`;

export function readCart(): Item[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as Item[]; } catch { return []; }
}

let timer: ReturnType<typeof setTimeout> | undefined;
export function writeCart(items: Item[], push = true) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  window.dispatchEvent(new Event("ss-cart"));
  if (push) { clearTimeout(timer); timer = setTimeout(() => pushCart(items), 600); }
}

async function pushCart(items: Item[]) {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return;
  const { data: cart } = await supabase.from("carts").upsert({ user_id: uid }, { onConflict: "user_id" }).select("id").single();
  if (!cart) return;
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  if (items.length) {
    await supabase.from("cart_items").insert(
      items.map((i) => ({ cart_id: cart.id, product_id: i.productId, quantity: i.qty, size: i.size, color: i.color }))
    );
  }
}

export async function pullAndMerge() {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return;
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", uid).maybeSingle();
  let remote: Item[] = [];
  if (cart) {
    const { data } = await supabase
      .from("cart_items")
      .select("quantity,size,color,product_id,products(name,slug,price,stock,product_images(url,sort_order))")
      .eq("cart_id", cart.id);
    remote = (data ?? []).flatMap((r: any): Item[] => {
      const p = Array.isArray(r.products) ? r.products[0] : r.products;
      if (!p) return [];
      const img = [...(p.product_images ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
      return [{ productId: r.product_id, slug: p.slug, name: p.name, price: Number(p.price), image: img?.url ?? null, size: r.size, color: r.color, qty: r.quantity, stock: p.stock }];
    });
  }
  const map = new Map<string, Item>();
  for (const i of remote) map.set(itemKey(i), i);
  for (const i of readCart()) {
    const k = itemKey(i);
    const ex = map.get(k);
    map.set(k, ex ? { ...ex, qty: Math.min(Math.max(ex.qty, i.qty), i.stock || 100) } : i);
  }
  writeCart([...map.values()]);
}

export function useCart(): [Item[], boolean] {
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const f = () => { setItems(readCart()); setReady(true); };
    f();
    window.addEventListener("ss-cart", f);
    window.addEventListener("storage", f);
    return () => { window.removeEventListener("ss-cart", f); window.removeEventListener("storage", f); };
  }, []);
  return [items, ready];
}
