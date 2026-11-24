"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";

type WL = "en" | "ro" | "ur";

const T = {
  en: {
    first: "Welcome to Smart Shop — Discover Something Beautiful.",
    back: "Welcome Back!",
    firstName: (n: string) => `Welcome to Smart Shop, ${n}!`,
    backName: (n: string) => `Welcome back, ${n}!`,
    close: "Close",
  },
  ro: {
    first: "Smart Shop mein khush aamdeed — Kuch Khoobsurat Dhoondein.",
    back: "Dobara khush aamdeed!",
    firstName: (n: string) => `Smart Shop mein khush aamdeed, ${n}!`,
    backName: (n: string) => `Dobara khush aamdeed, ${n}!`,
    close: "Band karein",
  },
  ur: {
    first: "اسمارٹ شاپ میں خوش آمدید — کچھ خوبصورت دریافت کریں۔",
    back: "دوبارہ خوش آمدید!",
    firstName: (n: string) => `اسمارٹ شاپ میں خوش آمدید، ${n}!`,
    backName: (n: string) => `دوبارہ خوش آمدید، ${n}!`,
    close: "بند کریں",
  },
};

export default function WelcomeBar({ lang }: { lang: WL }) {
  const t = T[lang] ?? T.en;
  const [first, setFirst] = useState<boolean | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    let alive = true;
    let isFirst = false;
    try {
      if (sessionStorage.getItem("ss_welcome_off") === "1") return;
      if (!localStorage.getItem("ss_seen")) {
        localStorage.setItem("ss_seen", "1");
        sessionStorage.setItem("ss_first", "1");
        isFirst = true;
      } else {
        isFirst = sessionStorage.getItem("ss_first") === "1";
      }
    } catch {}
    setFirst(isFirst);

    (async () => {
      try {
        const { data: s } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("slow")), 5000)),
        ]);
        const u = s.session?.user;
        if (!u) return;
        const { data: p } = await supabase.from("profiles").select("full_name").eq("id", u.id).maybeSingle();
        const n = String(p?.full_name ?? "").trim().split(/\s+/)[0] ?? "";
        if (alive && n) setName(n);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  if (first === null) return null;

  const text = first ? (name ? t.firstName(name) : t.first) : name ? t.backName(name) : t.back;

  function close() {
    try { sessionStorage.setItem("ss_welcome_off", "1"); } catch {}
    setFirst(null);
  }

  return (
    <div style={{ background: "#fbf3dc", borderBottom: "1px solid #eadfb8", color: "#0b1f3a" }}>
      <style>{`.wb{max-width:1100px;margin:0 auto;padding:0 8px 0 16px;display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;font-size:.95rem}.wb button{min-width:44px;min-height:44px;border:0;background:none;color:#0b1f3a;font:inherit;font-size:1.3rem;cursor:pointer}`}</style>
      <div className="wb">
        <span>{text}</span>
        <button type="button" aria-label={t.close} onClick={close}>×</button>
      </div>
    </div>
  );
}
