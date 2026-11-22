import { cookies } from "next/headers";
import type { L } from "@/lib/checkui";
import Top from "../../components/Top";
import OrderView from "../../components/OrderView";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const v = (await cookies()).get("lang")?.value;
  const lang: L = v === "ro" || v === "ur" ? v : "en";
  return (<><Top /><OrderView lang={lang} number={number} /></>);
}
