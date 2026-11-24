import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import BarLinks from "./components/BarLinks";
import Footer from "./components/Footer";
import { getSupabase } from "@/lib/supabase";
import type { L } from "@/lib/cartui";

export async function generateMetadata(): Promise<Metadata> {
  let name = "Smart Shop Online Shopping";
  let desc = "Premium fashion and lifestyle products with Cash on Delivery across Pakistan.";
  let logo = "";
  try {
    const { data } = await getSupabase()
      .from("store_settings")
      .select("key,value")
      .in("key", ["store_name", "store_description", "store_logo_url"]);
    for (const r of data ?? []) {
      const v = String(r.value ?? "").trim();
      if (r.key === "store_name" && v) name = v;
      if (r.key === "store_description" && v) desc = v.slice(0, 200);
      if (r.key === "store_logo_url" && /^https:\/\/[^\s"'<>]+$/.test(v)) logo = v;
    }
  } catch {}
  return {
    title: name,
    description: desc,
    openGraph: { siteName: name, title: name, description: desc, type: "website", images: logo ? [logo] : [] },
    twitter: { card: "summary", title: name, description: desc },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const v = (await cookies()).get("lang")?.value;
  const lang: L = v === "ro" || v === "ur" ? v : "en";
  return (
    <html lang={lang === "ur" ? "ur" : "en"} dir={lang === "ur" ? "rtl" : "ltr"}>
      <body>
        <BarLinks lang={lang} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
