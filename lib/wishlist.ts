"use client";
import { supabase } from "./browser";

export function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

export async function myWishlistId(create: boolean): Promise<{ uid: string | null; wid: string | null }> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id ?? null;
  if (!uid) return { uid: null, wid: null };
  const { data } = await supabase.from("wishlists").select("id").eq("user_id", uid).maybeSingle();
  if (data) return { uid, wid: data.id as string };
  if (!create) return { uid, wid: null };
  const { data: made } = await supabase
    .from("wishlists")
    .upsert({ user_id: uid }, { onConflict: "user_id" })
    .select("id")
    .single();
  return { uid, wid: (made?.id as string | undefined) ?? null };
}
