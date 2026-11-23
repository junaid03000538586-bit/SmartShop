import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Top from "../../components/Top";

export const dynamic = "force-dynamic";

const KEY: Record<string, string> = {
  about: "about_us",
  "return-policy": "return_policy",
  "privacy-policy": "privacy_policy",
  terms: "terms_and_conditions",
  contact: "",
};

const TITLE: Record<string, { en: string; ro: string; ur: string }> = {
  about: { en: "About us", ro: "Hamare baare mein", ur: "ہمارے بارے میں" },
  "return-policy": { en: "Return & exchange policy", ro: "Return aur exchange policy", ur: "واپسی اور تبادلہ کی پالیسی" },
  "privacy-policy": { en: "Privacy policy", ro: "Privacy policy", ur: "پرائیویسی پالیسی" },
  terms: { en: "Terms & conditions", ro: "Terms aur conditions", ur: "شرائط و ضوابط" },
  contact: { en: "Contact us", ro: "Rabta karein", ur: "رابطہ کریں" },
};

const L = {
  en: { back: "← Back to shop", soon: "This page will be updated soon.", phone: "Phone", wa: "Chat on WhatsApp", mail: "Email", call: "Call us", none: "Contact details will be added soon." },
  ro: { back: "← Dukaan par wapas", soon: "Ye page jaldi update hoga.", phone: "Phone", wa: "WhatsApp par baat karein", mail: "Email", call: "Call karein", none: "Rabta ki tafseel jaldi shamil hogi." },
  ur: { back: "← دکان پر واپس", soon: "یہ صفحہ جلد اپ ڈیٹ ہو گا۔", phone: "فون", wa: "واٹس ایپ پر بات کریں", mail: "ای میل", call: "کال کریں", none: "رابطے کی تفصیل جلد شامل کی جائے گی۔" },
};

function pickLang(v: string | undefined): "en" | "ro" | "ur" {
  return v === "ro" || v === "ur" ? v : "en";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = TITLE[slug];
  return { title: t ? `${t.en} | Smart Shop` : "Smart Shop" };
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in KEY)) notFound();

  const lang = pickLang((await cookies()).get("lang")?.value);
  const l = L[lang];
  const title = TITLE[slug][lang];

  const keys = slug === "contact"
    ? ["contact_phone", "whatsapp_number", "store_email", "facebook_url", "instagram_url", "tiktok_url"]
    : [KEY[slug]];
  const s: Record<string, string> = {};
  const { data } = await getSupabase().from("store_settings").select("key,value").in("key", keys);
  (data ?? []).forEach((r: { key: string; value: string }) => { s[r.key] = r.value; });

  const wa = (s.whatsapp_number ?? "").replace(/\D/g, "");
  const phone = (s.contact_phone ?? "").trim();
  const mail = (s.store_email ?? "").trim();
  const social = ([["Facebook", s.facebook_url], ["Instagram", s.instagram_url], ["TikTok", s.tiktok_url]] as [string, string | undefined][])
    .filter(([, u]) => !!u && /^https?:\/\//i.test(u as string));

  return (
    <>
      <Top />
      <main className="wrap" style={{ maxWidth: 680 }}>
        <a className="back" href="/">{l.back}</a>
        <h1 className="pname">{title}</h1>

        {slug !== "contact" && (
          (s[KEY[slug]] ?? "").trim()
            ? <p style={{ whiteSpace: "pre-line" }}>{s[KEY[slug]]}</p>
            : <p className="muted">{l.soon}</p>
        )}

        {slug === "contact" && (
          <>
            {!wa && !phone && !mail && social.length === 0 && <p className="muted">{l.none}</p>}
            {phone && <p><strong>{l.phone}:</strong> <a href={`tel:${phone}`} style={{ textDecoration: "underline" }}>{phone}</a></p>}
            {mail && <p><strong>{l.mail}:</strong> <a href={`mailto:${mail}`} style={{ textDecoration: "underline" }}>{mail}</a></p>}
            {social.length > 0 && (
              <p>
                {social.map(([n, u]) => (
                  <a key={n} href={u as string} target="_blank" rel="noopener noreferrer" className="pill">{n}</a>
                ))}
              </p>
            )}
            {wa && <a className="btn" style={{ background: "#1f8f4e", color: "#fff", marginTop: 8 }} href={`https://wa.me/${wa}`}>{l.wa}</a>}
          </>
        )}
      </main>
    </>
  );
}
