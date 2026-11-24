import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  if (!host) return [];
  const base = `https://${host}`;
  const now = new Date();

  const out: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...["about", "contact", "return-policy", "privacy-policy", "terms"].map((s) => ({
      url: `${base}/info/${s}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];

  try {
    const db = getSupabase();
    const [{ data: cats }, { data: prods }] = await Promise.all([
      db.from("categories").select("slug,updated_at"),
      db.from("products").select("slug,updated_at").eq("is_visible", true).order("created_at", { ascending: false }).limit(1000),
    ]);
    for (const c of cats ?? []) {
      out.push({ url: `${base}/category/${c.slug}`, lastModified: c.updated_at ? new Date(c.updated_at) : now, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const p of prods ?? []) {
      out.push({ url: `${base}/product/${p.slug}`, lastModified: p.updated_at ? new Date(p.updated_at) : now, changeFrequency: "weekly", priority: 0.8 });
    }
  } catch {}

  return out;
}
