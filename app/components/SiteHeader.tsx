import { LANGS, type Lang } from "@/lib/i18n";
import { setLang } from "@/app/actions";

export default function SiteHeader({ lang }: { lang: Lang }) {
  return (
    <header className="top">
      <div className="wrap">
        <a className="brand" href="/">Smart Shop</a>
        <form action={setLang} className="langs">
          {LANGS.map((l) => (
            <button key={l.code} name="lang" value={l.code} aria-pressed={lang === l.code}>
              {l.label}
            </button>
          ))}
        </form>
      </div>
    </header>
  );
}
