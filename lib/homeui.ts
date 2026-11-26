export type HL = "en" | "ro" | "ur";

const en = {
  newArrivals: "New arrivals", bestSellers: "Best sellers", trending: "Trending now",
  collections: "Special collections", reviews: "What our customers say", viewAll: "View all",
  shopNow: "Shop now", prev: "Previous slide", next: "Next slide", go: "Go to slide",
  t1: "Cash on Delivery", t2: "Easy exchange", t3: "WhatsApp support",
};
const ro: typeof en = {
  newArrivals: "Naya saman", bestSellers: "Sab se zyada bikne wale", trending: "Aaj kal pasandeeda",
  collections: "Khaas collections", reviews: "Hamare customers kya kehte hain", viewAll: "Sab dekhein",
  shopNow: "Abhi kharidein", prev: "Pichli slide", next: "Agli slide", go: "Slide par jaayein",
  t1: "Cash on Delivery", t2: "Aasan exchange", t3: "WhatsApp support",
};
const ur: typeof en = {
  newArrivals: "نیا سامان", bestSellers: "سب سے زیادہ بکنے والے", trending: "آج کل مقبول",
  collections: "خاص کلیکشنز", reviews: "ہمارے کسٹمرز کیا کہتے ہیں", viewAll: "سب دیکھیں",
  shopNow: "ابھی خریدیں", prev: "پچھلی سلائیڈ", next: "اگلی سلائیڈ", go: "سلائیڈ پر جائیں",
  t1: "کیش آن ڈیلیوری", t2: "آسان تبادلہ", t3: "واٹس ایپ سپورٹ",
};

export const h: Record<HL, typeof en> = { en, ro, ur };

export type Review = { id: string; name: string; city: string; rating: number; text: string };

export function parseReviews(raw: string | null | undefined): Review[] {
  try {
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return [];
    return arr
      .flatMap((r: any): Review[] => {
        const name = String(r?.name ?? "").trim().slice(0, 40);
        const text = String(r?.text ?? "").trim().slice(0, 300);
        const rating = Math.round(Number(r?.rating));
        if (name.length < 2 || text.length < 5 || !(rating >= 1 && rating <= 5)) return [];
        return [{
          id: String(r?.id ?? name + text.length).slice(0, 60),
          name, city: String(r?.city ?? "").trim().slice(0, 30), rating, text,
        }];
      })
      .slice(0, 12);
  } catch {
    return [];
  }
}
