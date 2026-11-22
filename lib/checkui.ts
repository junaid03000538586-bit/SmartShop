export type L = "en" | "ro" | "ur";
const en = {
  title: "Checkout", needLogin: "Please log in to place your order.", login: "Log in",
  name: "Full name", phone: "Phone number", whatsapp: "WhatsApp number (optional)",
  city: "City", address: "Complete delivery address", postal: "Postal code (optional)",
  notes: "Additional instructions (optional)", payment: "Payment method",
  cod: "Cash on Delivery", codNote: "Pay when your order arrives.",
  summary: "Order summary", subtotal: "Subtotal", delivery: "Delivery", total: "Total",
  free: "Free", place: "Place order", placing: "Placing order…",
  empty: "Your cart is empty.", shop: "Continue shopping", loading: "Loading…",
  done: "Thank you! Your order is placed.", orderNo: "Order number", status: "Status",
  items: "Items", deliverTo: "Delivery address", wa: "Send order on WhatsApp", notFound: "Order not found.",
  st: { new: "New order", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" } as Record<string, string>,
};
const ro: typeof en = {
  title: "Checkout", needLogin: "Order ke liye pehle login karein.", login: "Login karein",
  name: "Poora naam", phone: "Phone number", whatsapp: "WhatsApp number (zaroori nahi)",
  city: "Shehar", address: "Delivery ka poora pata", postal: "Postal code (zaroori nahi)",
  notes: "Mazeed hidayat (zaroori nahi)", payment: "Payment ka tareeqa",
  cod: "Cash on Delivery", codNote: "Order milne par payment karein.",
  summary: "Order ka khulasa", subtotal: "Subtotal", delivery: "Delivery", total: "Total",
  free: "Free", place: "Order karein", placing: "Order ho raha hai…",
  empty: "Aapka cart khali hai.", shop: "Khareedari jaari rakhein", loading: "Intezar karein…",
  done: "Shukriya! Aapka order ho gaya.", orderNo: "Order number", status: "Halat",
  items: "Cheezein", deliverTo: "Delivery ka pata", wa: "WhatsApp par order bhejein", notFound: "Order nahi mila.",
  st: { new: "Naya order", confirmed: "Confirm", processing: "Tayyar ho raha hai", shipped: "Rawana", delivered: "Pohanch gaya", cancelled: "Cancel" },
};
const ur: typeof en = {
  title: "چیک آؤٹ", needLogin: "آرڈر کے لیے پہلے لاگ ان کریں۔", login: "لاگ ان کریں",
  name: "پورا نام", phone: "فون نمبر", whatsapp: "واٹس ایپ نمبر (اختیاری)",
  city: "شہر", address: "ڈیلیوری کا مکمل پتہ", postal: "پوسٹل کوڈ (اختیاری)",
  notes: "اضافی ہدایات (اختیاری)", payment: "ادائیگی کا طریقہ",
  cod: "کیش آن ڈیلیوری", codNote: "آرڈر ملنے پر ادائیگی کریں۔",
  summary: "آرڈر کا خلاصہ", subtotal: "ذیلی کل", delivery: "ڈیلیوری", total: "کل",
  free: "مفت", place: "آرڈر کریں", placing: "آرڈر ہو رہا ہے…",
  empty: "آپ کا کارٹ خالی ہے۔", shop: "خریداری جاری رکھیں", loading: "انتظار کریں…",
  done: "شکریہ! آپ کا آرڈر ہو گیا۔", orderNo: "آرڈر نمبر", status: "حالت",
  items: "اشیاء", deliverTo: "ڈیلیوری کا پتہ", wa: "واٹس ایپ پر آرڈر بھیجیں", notFound: "آرڈر نہیں ملا۔",
  st: { new: "نیا آرڈر", confirmed: "تصدیق شدہ", processing: "تیار ہو رہا ہے", shipped: "روانہ", delivered: "پہنچ گیا", cancelled: "منسوخ" },
};
export const k: Record<L, typeof en> = { en, ro, ur };
