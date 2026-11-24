import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/cart", "/checkout", "/account", "/order/", "/login", "/wishlist", "/search", "/debug"],
      },
    ],
    sitemap: host ? `https://${host}/sitemap.xml` : undefined,
  };
}
