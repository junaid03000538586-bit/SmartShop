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
    const id = setInterval(() => setI((x) => (x + 1) % n), 6000);
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
        .hs{position:relative;overflow:hidden;background:#0b1f3a;border-bottom:3px solid #c9a24b}
        .hs-track{display:flex;transition:transform .7s cubic-bezier(.22,.61,.36,1)}
        .hs-slide{flex:0 0 100%;position:relative;overflow:hidden;min-height:clamp(420px,70vh,620px);display:flex;align-items:center;color:#fff;
          background:radial-gradient(circle at 85% 15%,rgba(201,162,75,.38),transparent 46%),radial-gradient(circle at 10% 95%,rgba(201,162,75,.16),transparent 40%),linear-gradient(135deg,#091a31,#16315a)}
        .hs-slide>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
        .hs-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,26,49,.86) 0%,rgba(9,26,49,.45) 55%,rgba(9,26,49,.1) 100%),linear-gradient(0deg,rgba(9,26,49,.7) 0%,transparent 40%)}
        [dir="rtl"] .hs-shade{background:linear-gradient(270deg,rgba(9,26,49,.86) 0%,rgba(9,26,49,.45) 55%,rgba(9,26,49,.1) 100%),linear-gradient(0deg,rgba(9,26,49,.7) 0%,transparent 40%)}
        .hs-plain::before,.hs-plain::after{content:"";position:absolute;border-radius:50%;border:2px solid rgba(201,162,75,.35);pointer-events:none}
        .hs-plain::before{width:360px;height:360px;top:-120px;inset-inline-end:-100px}
        .hs-plain::after{width:200px;height:200px;bottom:-70px;inset-inline-end:18%;border-color:rgba(201,162,75,.22)}
        .hs-body{position:relative;z-index:1;width:100%;max-width:1100px;margin:0 auto;padding:56px 18px 84px}
        .hs-body h1,.hs-body h2{font-family:Georgia,"Times New Roman",serif;font-size:clamp(2.2rem,7vw,4.1rem);line-height:1.1;margin:0 0 16px;color:#fff;max-width:15ch;letter-spacing:.2px;text-shadow:0 2px 18px rgba(0,0,0,.35)}
        .hs-body h1::before,.hs-body h2::before{content:"";display:block;width:60px;height:3px;border-radius:2px;background:#c9a24b;margin-bottom:18px}
        .hs-body p{max-width:42ch;margin:0 0 28px;opacity:.94;font-size:1.08rem;line-height:1.75}
        .hs-body .btn{min-height:52px;padding:0 34px;font-size:1rem;box-shadow:0 10px 26px rgba(0,0,0,.32)}
        .hs-slide[data-on="1"]>img{animation:hs-kb 10s ease-out both}
        .hs-slide[data-on="1"] .hs-body>*{animation:hs-up .85s ease-out both}
        .hs-slide[data-on="1"] .hs-body>*:nth-child(2){animation-delay:.16s}
        .hs-slide[data-on="1"] .hs-body>*:nth-child(3){animation-delay:.32s}
        @keyframes hs-kb{from{transform:scale(1)}to{transform:scale(1.09)}}
        @keyframes hs-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        .hs-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.16);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#fff;font-size:1.7rem;line-height:1;cursor:pointer}
        .hs-arrow:hover{background:rgba(255,255,255,.3)}
        .hs-prev{inset-inline-start:10px}.hs-next{inset-inline-end:10px}
        [dir="rtl"] .hs-arrow{transform:translateY(-50%) scaleX(-1)}
        .hs-count{position:absolute;z-index:2;bottom:20px;inset-inline-start:18px;color:#fff;font-family:Georgia,serif;letter-spacing:2px;font-size:.95rem;opacity:.9}
        .hs-count b{color:#c9a24b}
        .hs-dots{position:absolute;bottom:12px;inset-inline:0;z-index:2;display:flex;justify-content:center}
        .hs-dot{width:30px;height:44px;border:0;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
        .hs-dot i{display:block;width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.5);transition:width .3s}
        .hs-dot[aria-current="true"] i{background:#c9a24b;width:24px;border-radius:6px}
        @media (prefers-reduced-motion:reduce){
          .hs-track{transition:none}
          .hs-slide>img,.hs-slide .hs-body>*{animation:none!important}
          .hs-dot i{transition:none}
        }
      `}</style>
      <div className="hs-track" style={{ transform: `translateX(${-flip * i * 100}%)` }}>
        {slides.map((s, k) => {
          const Tag: "h1" | "h2" = k === 0 ? "h1" : "h2";
          return (
            <div
              className={"hs-slide" + (s.image ? "" : " hs-plain")}
              data-on={k === i ? "1" : "0"}
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${k + 1} / ${n}`}
              aria-hidden={k !== i}
            >
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
          <div className="hs-count" aria-hidden="true">
            <b>{String(i + 1).padStart(2, "0")}</b> / {String(n).padStart(2, "0")}
          </div>
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
