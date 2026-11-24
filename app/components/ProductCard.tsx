import HeartBtn from "./HeartBtn";

export type CardProduct = {
  id: string; name: string; slug: string; price: number | string;
  original_price: number | string | null; stock: number;
  product_images: { url: string; sort_order: number }[] | null;
};

export default function ProductCard({ p, outLabel }: { p: CardProduct; outLabel: string }) {
  const img = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  return (
    <div className="card" style={{ position: "relative" }}>
      <a href={`/product/${p.slug}`} style={{ display: "block", color: "inherit" }}>
        {img ? <img src={img.url} alt={p.name} loading="lazy" /> : <div className="ph" />}
        <div className="body">
          <div>{p.name}</div>
          <div className="price">
            Rs. {Number(p.price).toLocaleString("en-PK")}
            {p.original_price && <span className="old">Rs. {Number(p.original_price).toLocaleString("en-PK")}</span>}
          </div>
          {p.stock < 1 && <div className="muted">{outLabel}</div>}
        </div>
      </a>
      <HeartBtn productId={p.id} />
    </div>
  );
}
