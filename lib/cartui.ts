export type L = "en" | "ro" | "ur";

const en = {
  login: "Log in", account: "Account", cart: "Cart", yourCart: "Your cart",
  add: "Add to cart", chooseSize: "Please choose a size.", chooseColor: "Please choose a color.",
  added: "Added to cart.", viewCart: "View cart", noMore: "No more stock available.",
  empty: "Your cart is empty.", cont: "Continue shopping", subtotal: "Subtotal",
  note: "Delivery charges are added at checkout.", checkout: "Checkout", remove: "Remove",
  changed: "Some prices or stock changed. Please review your cart.",
  gone: "An item is no longer available and was removed.", size: "Size", color: "Color", loading: "Loading…",
};
const ro: typeof en = {
  login: "Login", account: "Account", cart: "Cart", yourCart: "Aapka cart",
  add: "Cart mein daalein", chooseSize: "Size chunein.", chooseColor: "Color chunein.",
  added: "Cart mein daal diya.", viewCart: "Cart dekhein", noMore: "Mazeed stock maujood nahi.",
  empty: "Aapka cart khali hai.", cont: "Khareedari jaari rakhein", subtotal: "Subtotal",
  note: "Delivery charges checkout par lagte hain.", checkout: "Checkout", remove: "Hatayein",
  changed: "Kuch qeemat ya stock badal gaya hai. Cart dobara dekh lein.",
  gone: "Ek cheez ab maujood nahi thi, isliye hata di gayi.", size: "Size", color: "Color", loading: "Intezar karein…",
};
const ur: typeof en = {
  login: "لاگ ان", account: "اکاؤنٹ", cart: "کارٹ", yourCart: "آپ کا کارٹ",
  add: "کارٹ میں ڈالیں", chooseSize: "سائز منتخب کریں۔", chooseColor: "رنگ منتخب کریں۔",
  added: "کارٹ میں ڈال دیا۔", viewCart: "کارٹ دیکھیں", noMore: "مزید اسٹاک موجود نہیں۔",
  empty: "آپ کا کارٹ خالی ہے۔", cont: "خریداری جاری رکھیں", subtotal: "ذیلی کل",
  note: "ڈیلیوری چارجز چیک آؤٹ پر شامل ہوتے ہیں۔", checkout: "چیک آؤٹ", remove: "ہٹائیں",
  changed: "کچھ قیمتیں یا اسٹاک بدل گیا ہے۔ کارٹ دوبارہ دیکھ لیں۔",
  gone: "ایک چیز اب موجود نہیں تھی، اس لیے ہٹا دی گئی۔", size: "سائز", color: "رنگ", loading: "انتظار کریں…",
};

export const c: Record<L, typeof en> = { en, ro, ur };
