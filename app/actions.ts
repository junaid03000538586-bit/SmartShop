"use server";
import { cookies } from "next/headers";

export async function setLang(formData: FormData) {
  const lang = String(formData.get("lang"));
  if (["en", "ro", "ur"].includes(lang)) {
    (await cookies()).set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
}
