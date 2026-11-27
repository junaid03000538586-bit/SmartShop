export type TL = "en" | "ro" | "ur";

const en = {
  title: "Track your order", intro: "Enter your order number and the phone number you used when you ordered.",
  orderNo: "Order number", orderPh: "e.g. SS-261123-01002", phone: "Phone number",
  btn: "Track order", wait: "Checking…", need: "Please enter your order number and phone number.",
  notFound: "We could not find this order. Please check the order number and phone number. If you tried several times, wait 15 minutes and try again.",
  slow: "The server did not answer. Please check your internet and try again.",
  placed: "Placed on", updated: "Last update", items: "Items", city: "Delivery city",
  subtotal: "Subtotal", delivery: "Delivery", total: "Total", free: "Free", cod: "Cash on Delivery",
  shippedNote: "After dispatch, delivery usually takes 5 to 6 days.", cancelled: "This order was cancelled.",
  another: "Track another order", ask: "Ask on WhatsApp", back: "← Back to shop", help: "Need help?",
  askMsg: (n: string) => `Hello, I need help with my order ${n}.`,
};
const ro: typeof en = {
  title: "Apna order track karein", intro: "Apna order number aur wo phone number likhein jo order karte waqt diya tha.",
  orderNo: "Order number", orderPh: "jaise SS-261123-01002", phone: "Phone number",
  btn: "Order track karein", wait: "Check ho raha hai…", need: "Apna order number aur phone number likhein.",
  notFound: "Ye order nahi mila. Order number aur phone number check karein. Agar kai baar koshish ki hai to 15 minute baad dobara try karein.",
  slow: "Server ne jawab nahi diya. Internet check karke dobara try karein.",
  placed: "Order ki tareekh", updated: "Aakhri update", items: "Cheezein", city: "Delivery ka shehar",
  subtotal: "Subtotal", delivery: "Delivery", total: "Total", free: "Free", cod: "Cash on Delivery",
  shippedNote: "Rawana hone ke baad aam tor par 5 se 6 din mein pohanchta hai.", cancelled: "Ye order cancel ho chuka hai.",
  another: "Doosra order track karein", ask: "WhatsApp par poochein", back: "← Dukaan par wapas", help: "Madad chahiye?",
  askMsg: (n: string) => `Hello, mujhe apne order ${n} ke baare mein madad chahiye.`,
};
const ur: typeof en = {
  title: "اپنا آرڈر ٹریک کریں", intro: "اپنا آرڈر نمبر اور وہ فون نمبر لکھیں جو آرڈر کرتے وقت دیا تھا۔",
  orderNo: "آرڈر نمبر", orderPh: "جیسے SS-261123-01002", phone: "فون نمبر",
  btn: "آرڈر ٹریک کریں", wait: "چیک ہو رہا ہے…", need: "اپنا آرڈر نمبر اور فون نمبر لکھیں۔",
  notFound: "یہ آرڈر نہیں ملا۔ آرڈر نمبر اور فون نمبر چیک کریں۔ اگر کئی بار کوشش کی ہے تو 15 منٹ بعد دوبارہ کوشش کریں۔",
  slow: "سرور نے جواب نہیں دیا۔ انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔",
  placed: "آرڈر کی تاریخ", updated: "آخری اپ ڈیٹ", items: "اشیاء", city: "ڈیلیوری کا شہر",
  subtotal: "ذیلی کل", delivery: "ڈیلیوری", total: "کل", free: "مفت", cod: "کیش آن ڈیلیوری",
  shippedNote: "روانہ ہونے کے بعد عام طور پر 5 سے 6 دن میں پہنچتا ہے۔", cancelled: "یہ آرڈر منسوخ ہو چکا ہے۔",
  another: "دوسرا آرڈر ٹریک کریں", ask: "واٹس ایپ پر پوچھیں", back: "← دکان پر واپس", help: "مدد چاہیے؟",
  askMsg: (n: string) => `Hello, mujhe apne order ${n} ke baare mein madad chahiye.`,
};

export const tr: Record<TL, typeof en> = { en, ro, ur };
