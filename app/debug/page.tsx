"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";

function withTimeout<T>(p: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(label + " did not answer in " + ms / 1000 + " seconds")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

export default function Debug() {
  const [lines, setLines] = useState<string[]>(["Starting…"]);
  const add = (s: string) => setLines((l) => [...l, s]);

  useEffect(() => {
    (async () => {
      add("1. Supabase URL set: " + (process.env.NEXT_PUBLIC_SUPABASE_URL ? "YES" : "NO"));
      add("2. Publishable key set: " + (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "YES" : "NO"));

      let loggedIn = false;
      try {
        const t = Date.now();
        const { data } = await withTimeout(supabase.auth.getSession(), 8000, "Login check");
        loggedIn = !!data.session;
        add("3. Login check OK: " + (loggedIn ? "logged in" : "not logged in") + " (" + (Date.now() - t) + " ms)");
      } catch (e) {
        add("3. Login check FAILED: " + (e as Error).message);
      }

      if (loggedIn) {
        try {
          const { data, error } = await withTimeout(supabase.rpc("is_admin"), 8000, "Admin check");
          add("4. Admin check: " + (error ? "ERROR " + error.message : data === true ? "you ARE admin" : "you are NOT admin"));
        } catch (e) {
          add("4. Admin check FAILED: " + (e as Error).message);
        }
      } else {
        add("4. Admin check skipped (not logged in)");
      }

      try {
        const { count, error } = await withTimeout(
          supabase.from("products").select("id", { count: "exact", head: true }),
          8000,
          "Products read"
        );
        add("5. Products read: " + (error ? "ERROR " + error.message : "OK, " + count + " product(s)"));
      } catch (e) {
        add("5. Products read FAILED: " + (e as Error).message);
      }

      add("Done.");
    })();
  }, []);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>Check page</h1>
      {lines.map((l, i) => (
        <p key={i} style={{ margin: "8px 0" }}>{l}</p>
      ))}
    </main>
  );
}
