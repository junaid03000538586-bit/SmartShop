import type { Review } from "@/lib/homeui";

export default function Reviews({ title, items }: { title: string; items: Review[] }) {
  if (items.length === 0) return null;
  return (
    <section className="sec">
      <style>{`
        .rv-row{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px}
        .rv{flex:0 0 min(300px,82%);scroll-snap-align:start;margin:0;background:#fff;border:1px solid #eceae4;border-radius:18px;padding:18px}
        @media (min-width:900px){.rv-row{display:grid;grid-template-columns:repeat(3,1fr);overflow:visible}.rv{flex:none}}
        .rv-stars{color:#c9a24b;letter-spacing:2px;font-size:1.1rem}
        .rv-stars span{color:#d9d4c7}
        .rv blockquote{margin:10px 0;line-height:1.7}
        .rv figcaption{font-weight:600;color:#0b1f3a}
      `}</style>
      <div className="sec-head"><h2>{title}</h2></div>
      <div className="rv-row">
        {items.map((r) => (
          <figure className="rv" key={r.id}>
            <div className="rv-stars" role="img" aria-label={`${r.rating} / 5`}>
              {"★".repeat(r.rating)}<span>{"★".repeat(5 - r.rating)}</span>
            </div>
            <blockquote>{r.text}</blockquote>
            <figcaption>{r.name}{r.city ? ` · ${r.city}` : ""}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
