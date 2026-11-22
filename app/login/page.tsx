import { cookies } from "next/headers";
import type { L } from "@/lib/ui";
import Top from "../components/Top";
import LoginForm from "../components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const v = (await cookies()).get("lang")?.value;
  const lang: L = v === "ro" || v === "ur" ? v : "en";
  return (
    <>
      <Top />
      <LoginForm lang={lang} />
    </>
  );
}
