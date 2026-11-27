import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import type { L } from "@/lib/checkui";
import Top from "../components/Top";
import TrackView from "../components/TrackView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Track your order | Smart Shop" };

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.o) ? sp.o[0] : sp.o;
  const initial = String(raw ?? "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 30);

  const v = (await cookies()).get("lang")?.value;
  const lang: L = v === "ro" || v === "ur" ? v : "en";

  let wa = "";
  try {
    const { data } = await getSupabase().from("store_settings").select("value").eq("key", "whatsapp_number").maybeSingle();
    wa = String(data?.value ?? "").replace(/\D/g, "");
  } catch {}

  return (
    <>
      <Top />
      <TrackView lang={lang} initial={initial} wa={wa} />
    </>
  );
}
