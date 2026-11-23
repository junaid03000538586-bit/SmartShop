import { cookies } from "next/headers";
import type { AL } from "@/lib/acctui";
import Top from "../components/Top";
import AccountView from "../components/AccountView";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const v = (await cookies()).get("lang")?.value;
  const lang: AL = v === "ro" || v === "ur" ? v : "en";
  return (<><Top /><AccountView lang={lang} /></>);
}
