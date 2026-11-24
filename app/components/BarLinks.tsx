"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";
import { c, type L } from "@/lib/cartui";
import { useCart, pullAndMerge, writeCart } from "@/lib/cart";

export default function BarLinks({ lang }: { lang: L }) {
  const t = c[lang];
  const [items] = useCart();
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => {
      setLogged(!!session);
      if (ev === "SIGNED_OUT") writeCart([], false);
      if ((ev === "INITIAL_SESSION" || ev === "SIGNED_IN") && session) setTimeout(() => pullAndMerge(), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const count = items.reduce((n, i) => n + i.qty, 0);
  return (
    <div className="bar">
      <style>{`
        .bar{display:flex;justify-content:flex-end;gap:18px;padding:0 16px;background:#0b1f3a;border-bottom:1px solid #16315a}
        .bar a{display:inline-flex;align-items:center;gap:6px;min-height:44px;color:#c9a24b;font-weight:600}
        .bar .n{background:#c9a24b;color:#0b1f3a;border-radius:999px;min-width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:.8rem}
      `}</style>
      <a href={logged ? "/account" : "/login"}>{logged ? t.account : t.login}</a>
      <a href="/cart">{t.cart}{count > 0 && <span className="n">{count}</span>}</a>
    </div>
  );
}
