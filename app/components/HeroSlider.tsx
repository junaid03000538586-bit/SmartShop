"use client";
import { useEffect, useRef, useState } from "react";

export type Slide = {
  id: string; title: string | null; subtitle: string | null;
  button: string | null; link: string | null; image: string | null;
};

export default function HeroSlider({
  slides, rtl, labels,
}: {
  slides: Slide[]; rtl: boolean; labels: { prev: string; next: string; go: string };
}) {
  const n = slides.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (n < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), 5500);
    return () => clearInterval(id);
  }, [n, paused]);

  const go = (k: number) => setI((((k % n) + n) % n));
  const flip = rtl ? -1 : 1;

  return (
    <section
      className="hs"
      role="region"
      aria-roledescription="carousel"
      aria-label="Smart Shop"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const s = startX.current;
        startX.current = null;
        setPaused(false);
        if (s === null || n < 2) return;
        const dx = e.changedTouches[0].clientX - s;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1) * flip);
      }}
    >
      <style>{`
        .hs{position:relative;overflow:hidden;background:#0b1f3a}
        .hs-track{display:flex;transition:transform .6s ease}
        .hs-slide{flex:0 0 100%;position:relative;min-height:clamp(380px,64vh,560px);display:flex;align-items:center;color:#fff;
          background:radial-gradient(circle at 82% 18%,rgba(201,162,75,.35),transparent 45%),linear-gradient(135deg,#0b1f3a,#16315a)}
        .hs-slide>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
        .hs-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,31,58,.82),rgba(11,31,58,.2))}
        [dir="rtl"] .hs-shade{background:linear-gradient(270deg,rgba(11,31,58,.82),rgba(11,31,58,.2))}
        .hs-body{position:relative;z-index:1;width:100%;max-width:1100px;margin:0 auto;padding:48px 16px 72px}
        .hs-body h1,.hs-body h2{font-family:Georgia,"Times New Roman",serif;font-size:clamp(2rem,6.5vw,3.6rem);line-height:1.12;margin:0 0 14px;color:#fff;max-width:16ch}
        .hs-body p{max-width:44ch;margin:0 0 24px;opacity:.92;font-size:1.05rem}
        .hs-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.85);color:#0b1f3a;font-size:1.6rem;line-height:1;cursor:pointer}
        .hs-prev{inset-inline-start:10px}.hs-next{inset-inline-end:10px}
        [dir="rtl"] .hs-arrow{transform:translateY(-50%) scaleX(-1)}
        .hs-dots{position:absolute;bottom:12px;inset-inline:0;z-index:2;display:flex;justify-content:center}
        .hs-dot{width:30px;height:44px;border:0;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
        .hs-dot i{display:block;width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.5)}
        .hs-dot[aria-current="true"] i{background:#c9a24b;width:22px;border-radius:6px}
        @media (prefers-reduced-motion:reduce){.hs-track{transition:none}}
      `}</style>
      <div className="hs-track" style={{ transform: `translateX(${-flip * i * 100}%)` }}>
        {slides.map((s, k) => {
          const Tag: "h1" | "h2" = k === 0 ? "h1" : "h2";
          return (
            <div className="hs-slide" key={s.id} role="group" aria-roledescription="slide" aria-label={`${k + 1} / ${n}`} aria-hidden={k !== i}>
              {s.image && <img src={s.image} alt="" loading={k === 0 ? "eager" : "lazy"} fetchPriority={k === 0 ? "high" : "auto"} />}
              {s.image && <div className="hs-shade" />}
              <div className="hs-body">
                {s.title && <Tag>{s.title}</Tag>}
                {s.subtitle && <p>{s.subtitle}</p>}
                {s.button && s.link && <a className="btn" href={s.link} tabIndex={k === i ? 0 : -1}>{s.button}</a>}
              </div>
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <>
          <button type="button" className="hs-arrow hs-prev" aria-label={labels.prev} onClick={() => go(i - 1)}>‹</button>
          <button type="button" className="hs-arrow hs-next" aria-label={labels.next} onClick={() => go(i + 1)}>›</button>
          <div className="hs-dots">
            {slides.map((s, k) => (
              <button key={s.id} type="button" className="hs-dot" aria-label={`${labels.go} ${k + 1}`} aria-current={k === i} onClick={() => go(k)}><i /></button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
