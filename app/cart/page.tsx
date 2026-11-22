import { cookies } from "next/headers";
import type { L } from "@/lib/cartui";
import Top from "../components/Top";
import CartView from "../components/CartView";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const v = (await cookies()).get("lang")?.value;
  const lang: L = v === "ro" || v === "ur" ? v : "en";
  return (
    <>
      <Top />
      <CartView lang={lang} />
    </>
  );
}
