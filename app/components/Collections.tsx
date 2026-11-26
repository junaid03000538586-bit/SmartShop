export type Tile = { slug: string; name: string; image: string | null };

export default function Collections({ title, cta, tiles }: { title: string; cta: string; tiles: Tile[] }) {
  if (tiles.length === 0) return null;
  return (
    <section className="sec">
      <style>{`
        .cl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        @media (min-width:700px){.cl-grid{grid-template-columns:repeat(4,1fr)}}
        .cl-tile{position:relative;display:block;aspect-ratio:4/5;border-radius:18px;overflow:hidden;color:#fff;
          background:linear-gradient(135deg,#0b1f3a,#16315a)}
        .cl-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .5s}
        .cl-tile:hover img{transform:scale(1.05)}
        .cl-tile::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(11,31,58,.88))}
        .cl-label{position:absolute;inset-inline:14px;bottom:14px;z-index:1}
        .cl-label b{display:block;font-family:Georgia,serif;font-size:1.15rem}
        .cl-label span{font-size:.85rem;color:#c9a24b}
        @media (prefers-reduced-motion:reduce){.cl-tile img{transition:none}}
      `}</style>
      <div className="sec-head"><h2>{title}</h2></div>
      <div className="cl-grid">
        {tiles.map((t) => (
          <a key={t.slug} className="cl-tile" href={`/category/${t.slug}`}>
            {t.image && <img src={t.image} alt="" loading="lazy" />}
            <div className="cl-label"><b>{t.name}</b><span>{cta}</span></div>
          </a>
        ))}
      </div>
    </section>
  );
}
