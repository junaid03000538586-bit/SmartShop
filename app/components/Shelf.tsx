import ProductCard, { type CardProduct } from "./ProductCard";

export default function Shelf({
  id, title, items, outLabel, moreHref, moreLabel,
}: {
  id?: string; title: string; items: CardProduct[]; outLabel: string; moreHref?: string; moreLabel?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section id={id} className="sec">
      <style>{`
        .shelf{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 0 12px}
        .shelf>div{flex:0 0 168px;scroll-snap-align:start}
        @media (min-width:768px){
          .shelf{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));overflow:visible}
          .shelf>div{flex:none}
        }
      `}</style>
      <div className="sec-head">
        <h2>{title}</h2>
        {moreHref && moreLabel && <a href={moreHref}>{moreLabel}</a>}
      </div>
      <div className="shelf">
        {items.map((p) => (
          <div key={p.id}><ProductCard p={p} outLabel={outLabel} /></div>
        ))}
      </div>
    </section>
  );
}
