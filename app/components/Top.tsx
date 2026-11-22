import { cookies } from "next/headers";
import { LANGS, type Lang } from "@/lib/i18n";
import { setLang } from "../actions";

export default async function Top() {
  const lang = ((await cookies()).get("lang")?.value ?? "en") as Lang;
  return (
    <>
      <style>{`
        .gallery{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 0 12px}
        .gallery img{flex:0 0 85%;max-width:420px;aspect-ratio:3/4;object-fit:cover;border-radius:18px;scroll-snap-align:center;background:#eceae4}
        .pname{font-family:Georgia,serif;color:#0b1f3a;margin:12px 0 4px}
        .pill{display:inline-flex;align-items:center;min-height:40px;padding:0 16px;margin:0 8px 8px 0;border-radius:999px;border:1px solid #cfcac0;background:#fff}
        .badge{display:inline-block;padding:2px 12px;border-radius:999px;background:#c9a24b;color:#0b1f3a;font-weight:700;margin-inline-start:8px}
        .stock-ok{color:#1f8f4e;font-weight:600}.stock-out{color:#b42318;font-weight:600}
        .back{display:inline-block;margin:16px 0}
      `}</style>
      <header className="top">
        <div className="wrap">
          <a className="brand" href="/">Smart Shop</a>
          <form action={setLang} className="langs">
            {LANGS.map((l) => (
              <button key={l.code} name="lang" value={l.code} aria-pressed={lang === l.code}>{l.label}</button>
            ))}
          </form>
        </div>
      </header>
    </>
  );
}
