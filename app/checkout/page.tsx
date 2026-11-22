import { cookies } from "next/headers";
import type { L } from "@/lib/checkui";
import Top from "../components/Top";
import CheckoutView from "../components/CheckoutView";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const v = (await cookies()).get("lang")?.value;
  const lang: L = v === "ro" || v === "ur" ? v : "en";
  return (<><Top /><CheckoutView lang={lang} /></>);
}
