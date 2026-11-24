import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import Top from "../components/Top";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Find a product for me | Smart Shop" };

const T = {
  en: {
    title: "Can't find what you want?",
    intro: "Send us a photo of the product you like, and we will look for the same or a similar one for you.",
    steps: [
      "Tap the WhatsApp button below.",
      "Send us a photo of the product you like.",
      "We search for it and send you the details and price on WhatsApp.",
      "If you like it, we add it to the shop and you can order with Cash on Delivery.",
    ],
    note: "We search by hand. Availability and price are confirmed with you on WhatsApp.",
    btn: "Send a photo on WhatsApp",
    none: "The WhatsApp number will be added soon.",
    back: "← Back to shop",
    msg: "Hello, I would like a product like the photo I am sending.",
  },
  ro: {
    title: "Jo chahiye wo nahi mil raha?",
    intro: "Jo product pasand hai us ki photo bhejein, hum wahi ya milta julta product aap ke liye dhoondenge.",
    steps: [
      "Neeche WhatsApp ka button dabayein.",
      "Pasand ke product ki photo bhejein.",
      "Hum dhoond kar WhatsApp par tafseel aur price bhej denge.",
      "Pasand aaye to hum usay shop mein daal denge aur aap Cash on Delivery se order kar sakte hain.",
    ],
    note: "Hum haath se dhoondte hain. Maujoodgi aur price WhatsApp par aap se confirm hoti hai.",
    btn: "WhatsApp par photo bhejein",
    none: "WhatsApp number jaldi shamil hoga.",
    back: "← Dukaan par wapas",
    msg: "Hello, I would like a product like the photo I am sending.",
  },
  ur: {
    title: "جو چاہیے وہ نہیں مل رہا؟",
    intro: "جو پروڈکٹ پسند ہے اس کی تصویر بھیجیں، ہم وہی یا ملتی جلتی پروڈکٹ آپ کے لیے ڈھونڈیں گے۔",
    steps: [
      "نیچے واٹس ایپ کا بٹن دبائیں۔",
      "پسند کی پروڈکٹ کی تصویر بھیجیں۔",
      "ہم ڈھونڈ کر واٹس ایپ پر تفصیل اور قیمت بھیج دیں گے۔",
      "پسند آئے تو ہم اسے شاپ میں شامل کر دیں گے اور آپ کیش آن ڈیلیوری سے آرڈر کر سکتے ہیں۔",
    ],
    note: "ہم ہاتھ سے ڈھونڈتے ہیں۔ دستیابی اور قیمت واٹس ایپ پر آپ سے طے ہوتی ہے۔",
    btn: "واٹس ایپ پر تصویر بھیجیں",
    none: "واٹس ایپ نمبر جلد شامل کیا جائے گا۔",
    back: "← دکان پر واپس",
    msg: "Hello, I would like a product like the photo I am sending.",
  },
};

export default async function RequestPage() {
  const v = (await cookies()).get("lang")?.value;
  const lang = v === "ro" || v === "ur" ? v : "en";
  const t = T[lang];

  let wa = "";
  try {
    const { data } = await getSupabase().from("store_settings").select("value").eq("key", "whatsapp_number").maybeSingle();
    wa = String(data?.value ?? "").replace(/\D/g, "");
  } catch {}

  return (
    <>
      <Top />
      <main className="wrap" style={{ maxWidth: 620 }}>
        <a className="back" href="/">{t.back}</a>
        <h1 className="pname" style={{ marginTop: 0 }}>{t.title}</h1>
        <p>{t.intro}</p>
        <ol style={{ paddingInlineStart: 22, lineHeight: 1.9 }}>
          {t.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <p className="muted">{t.note}</p>
        {wa ? (
          <a className="btn" style={{ background: "#1f8f4e", color: "#fff", marginTop: 8 }} href={`https://wa.me/${wa}?text=${encodeURIComponent(t.msg)}`}>
            {t.btn}
          </a>
        ) : (
          <p className="muted">{t.none}</p>
        )}
      </main>
    </>
  );
}
