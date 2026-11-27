import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";

const T = {
  en: { track: "Track your order", find: "Find a product for me", about: "About us", contact: "Contact us", ret: "Return & exchange", priv: "Privacy policy", terms: "Terms & conditions", cod: "Cash on Delivery across Pakistan.", follow: "Follow us" },
  ro: { track: "Order track karein", find: "Mere liye product dhoondein", about: "Hamare baare mein", contact: "Rabta karein", ret: "Return aur exchange", priv: "Privacy policy", terms: "Terms aur conditions", cod: "Poore Pakistan mein Cash on Delivery.", follow: "Hamein follow karein" },
  ur: { track: "آرڈر ٹریک کریں", find: "میرے لیے پروڈکٹ تلاش کریں", about: "ہمارے بارے میں", contact: "رابطہ کریں", ret: "واپسی اور تبادلہ", priv: "پرائیویسی پالیسی", terms: "شرائط و ضوابط", cod: "پورے پاکستان میں کیش آن ڈیلیوری۔", follow: "ہمیں فالو کریں" },
};

export default async function Footer() {
  const v = (await cookies()).get("lang")?.value;
  const lang = v === "ro" || v === "ur" ? v : "en";
  const t = T[lang];
  const s: Record<string, string> = {};
  try {
    const { data } = await getSupabase()
      .from("store_settings")
      .select("key,value")
      .in("key", ["facebook_url", "instagram_url", "tiktok_url"]);
    (data ?? []).forEach((r: { key: string; value: string }) => { s[r.key] = r.value; });
  } catch {}
  const socials = (
    [["Facebook", s.facebook_url], ["Instagram", s.instagram_url], ["TikTok", s.tiktok_url]] as [string, string | undefined][]
  ).filter(([, u]) => !!u && /^https?:\/\//i.test(u as string));

  return (
    <footer>
      <div className="wrap">
        <style>{`.fl{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 18px;margin:8px 0}.fl a{display:inline-flex;align-items:center;min-height:44px;color:#fff;text-decoration:underline}.fl.fs a{color:#c9a24b}`}</style>
        <div className="fl">
          <a href="/track">{t.track}</a>
          <a href="/request">{t.find}</a>
          <a href="/info/about">{t.about}</a>
          <a href="/info/contact">{t.contact}</a>
          <a href="/info/return-policy">{t.ret}</a>
          <a href="/info/privacy-policy">{t.priv}</a>
          <a href="/info/terms">{t.terms}</a>
        </div>
        {socials.length > 0 && (
          <div className="fl fs">
            <span>{t.follow}:</span>
            {socials.map(([n, u]) => (
              <a key={n} href={u as string} target="_blank" rel="noopener noreferrer">{n}</a>
            ))}
          </div>
        )}
        <div>{t.cod}</div>
      </div>
    </footer>
  );
}
