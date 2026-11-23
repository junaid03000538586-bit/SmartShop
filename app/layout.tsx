import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import BarLinks from "./components/BarLinks";
import Footer from "./components/Footer";
import type { L } from "@/lib/cartui";

export const metadata: Metadata = {
  title: "Smart Shop Online Shopping",
  description: "Premium fashion and lifestyle products with Cash on Delivery across Pakistan.",
};

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
