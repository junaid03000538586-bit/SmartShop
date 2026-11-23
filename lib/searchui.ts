export type SL = "en" | "ro" | "ur";

const en = {
  title: "Search", ph: "Search by name, code or category", filters: "Filters",
  category: "Category", allCats: "All categories", minPrice: "Min price (Rs.)", maxPrice: "Max price (Rs.)",
  sort: "Sort by", newest: "Newest", low: "Price: low to high", high: "Price: high to low",
  inStock: "In stock only", featured: "Featured only", apply: "Search", clear: "Clear all",
  results: "product(s) found", none: "No products found. Try different words or fewer filters.",
  back: "← Back to shop", out: "Out of stock", first: "Showing the first 48 results.",
};
const ro: typeof en = {
  title: "Search", ph: "Naam, code ya category se dhoondein", filters: "Filters",
  category: "Category", allCats: "Saari categories", minPrice: "Kam se kam price (Rs.)", maxPrice: "Zyada se zyada price (Rs.)",
  sort: "Tarteeb", newest: "Naya pehle", low: "Price: kam se zyada", high: "Price: zyada se kam",
  inStock: "Sirf stock mein", featured: "Sirf featured", apply: "Dhoondein", clear: "Sab saaf karein",
  results: "product mile", none: "Koi product nahi mila. Doosre lafz ya kam filters try karein.",
  back: "← Dukaan par wapas", out: "Stock khatam", first: "Pehle 48 natijay dikha rahe hain.",
};
const ur: typeof en = {
  title: "تلاش", ph: "نام، کوڈ یا کیٹیگری سے تلاش کریں", filters: "فلٹرز",
  category: "کیٹیگری", allCats: "تمام کیٹیگریز", minPrice: "کم از کم قیمت (روپے)", maxPrice: "زیادہ سے زیادہ قیمت (روپے)",
  sort: "ترتیب", newest: "نیا پہلے", low: "قیمت: کم سے زیادہ", high: "قیمت: زیادہ سے کم",
  inStock: "صرف اسٹاک میں", featured: "صرف فیچرڈ", apply: "تلاش کریں", clear: "سب صاف کریں",
  results: "پروڈکٹس ملے", none: "کوئی پروڈکٹ نہیں ملا۔ دوسرے الفاظ یا کم فلٹرز آزمائیں۔",
  back: "← دکان پر واپس", out: "اسٹاک ختم", first: "پہلے 48 نتائج دکھا رہے ہیں۔",
};

export const s: Record<SL, typeof en> = { en, ro, ur };
