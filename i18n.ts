export type Lang = "en" | "ro" | "ur";
export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ro", label: "Roman Urdu" },
  { code: "ur", label: "اردو" },
];
export const t = {
  en: {
    search: "Search products", heroTitle: "Discover Something Beautiful.",
    heroText: "Fashion and lifestyle essentials, delivered to your door with Cash on Delivery.",
    shopNow: "Shop now", categories: "Shop by category", newArrivals: "New arrivals",
    empty: "Products will appear here soon.", whatsapp: "Order on WhatsApp",
    outOfStock: "Out of stock", footer: "Cash on Delivery across Pakistan.",
  },
  ro: {
    search: "Products dhoondein", heroTitle: "Kuch Khoobsurat Dhoondein.",
    heroText: "Fashion aur lifestyle ka saman, Cash on Delivery ke saath aapke darwaze par.",
    shopNow: "Abhi kharidein", categories: "Category ke hisaab se", newArrivals: "Naya saman",
    empty: "Products jaldi yahan nazar aayenge.", whatsapp: "WhatsApp par order karein",
    outOfStock: "Stock khatam", footer: "Poore Pakistan mein Cash on Delivery.",
  },
  ur: {
    search: "پروڈکٹ تلاش کریں", heroTitle: "کچھ خوبصورت دریافت کریں۔",
    heroText: "فیشن اور روزمرہ کا سامان، کیش آن ڈیلیوری کے ساتھ آپ کے دروازے پر۔",
    shopNow: "ابھی خریدیں", categories: "کیٹیگری کے مطابق", newArrivals: "نیا سامان",
    empty: "پروڈکٹس جلد یہاں نظر آئیں گے۔", whatsapp: "واٹس ایپ پر آرڈر کریں",
    outOfStock: "اسٹاک ختم", footer: "پورے پاکستان میں کیش آن ڈیلیوری۔",
  },
} as const;
