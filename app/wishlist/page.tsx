import { cookies } from "next/headers";
import type { WL } from "@/lib/wishui";
import Top from "../components/Top";
import WishlistView from "../components/WishlistView";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const v = (await cookies()).get("lang")?.value;
  const lang: WL = v === "ro" || v === "ur" ? v : "en";
  return (<><Top /><WishlistView lang={lang} /></>);
}
