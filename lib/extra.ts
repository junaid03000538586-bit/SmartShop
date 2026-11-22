type T = { back: string; inStock: string; out: string; left: string; sizes: string; colors: string; ask: string; empty: string; sku: string; off: string };

const mk = (o: T) => ({ ...o, outOfStock: o.out, askWa: o.ask, noProducts: o.empty });

export const x = {
  en: mk({ back: "← Back to shop", inStock: "In stock", out: "Out of stock", left: "left in stock", sizes: "Sizes", colors: "Colors", ask: "Ask on WhatsApp", empty: "No products in this category yet.", sku: "SKU", off: "% off" }),
  ro: mk({ back: "← Dukaan par wapas", inStock: "Stock mein hai", out: "Stock khatam", left: "stock baqi hai", sizes: "Sizes", colors: "Colors", ask: "WhatsApp par poochein", empty: "Is category mein abhi koi product nahi.", sku: "SKU", off: "% off" }),
  ur: mk({ back: "← دکان پر واپس", inStock: "اسٹاک میں موجود", out: "اسٹاک ختم", left: "اسٹاک باقی ہے", sizes: "سائز", colors: "رنگ", ask: "واٹس ایپ پر پوچھیں", empty: "اس کیٹیگری میں ابھی کوئی پروڈکٹ نہیں۔", sku: "SKU", off: "% off" }),
};
