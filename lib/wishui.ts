export type WL = "en" | "ro" | "ur";

const en = {
  save: "Save to wishlist", saved: "Saved to wishlist", title: "My wishlist",
  empty: "Your wishlist is empty.", move: "Move to cart", choose: "Choose options",
  remove: "Remove", out: "Out of stock", needLogin: "Please log in to see your wishlist.",
  login: "Log in", loading: "Loading…", back: "← Back to shop", shop: "Start shopping",
  slow: "The server did not answer. Please check your internet and try again.",
  moved: "Moved to your cart.", noMore: "No more stock available.", link: "Wishlist",
};
const ro: typeof en = {
  save: "Wishlist mein daalein", saved: "Wishlist mein hai", title: "Meri wishlist",
  empty: "Aap ki wishlist khali hai.", move: "Cart mein daalein", choose: "Size ya color chunein",
  remove: "Hatayein", out: "Stock khatam", needLogin: "Wishlist dekhne ke liye login karein.",
  login: "Login karein", loading: "Intezar karein…", back: "← Dukaan par wapas", shop: "Khareedari shuru karein",
  slow: "Server ne jawab nahi diya. Internet check karke dobara try karein.",
  moved: "Cart mein daal diya.", noMore: "Mazeed stock maujood nahi.", link: "Wishlist",
};
const ur: typeof en = {
  save: "پسندیدہ میں شامل کریں", saved: "پسندیدہ میں موجود", title: "میری پسندیدہ فہرست",
  empty: "آپ کی پسندیدہ فہرست خالی ہے۔", move: "کارٹ میں ڈالیں", choose: "سائز یا رنگ منتخب کریں",
  remove: "ہٹائیں", out: "اسٹاک ختم", needLogin: "پسندیدہ فہرست دیکھنے کے لیے لاگ ان کریں۔",
  login: "لاگ ان کریں", loading: "انتظار کریں…", back: "← دکان پر واپس", shop: "خریداری شروع کریں",
  slow: "سرور نے جواب نہیں دیا۔ انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔",
  moved: "کارٹ میں ڈال دیا۔", noMore: "مزید اسٹاک موجود نہیں۔", link: "پسندیدہ",
};

export const w: Record<WL, typeof en> = { en, ro, ur };
