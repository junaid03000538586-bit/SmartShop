import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Shop Online Shopping",
  description: "Premium fashion and lifestyle products with Cash on Delivery across Pakistan.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = (await cookies()).get("lang")?.value ?? "en";
  return (
    <html lang={lang === "ur" ? "ur" : "en"} dir={lang === "ur" ? "rtl" : "ltr"}>
      <body>{children}</body>
    </html>
  );
}
