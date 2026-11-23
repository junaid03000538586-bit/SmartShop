export type AL = "en" | "ro" | "ur";

const en = {
  title: "My account", email: "Email", profile: "My details", name: "Full name", phone: "Phone number",
  wa: "WhatsApp number (optional)", save: "Save details", saving: "Saving…", saved: "Details saved.",
  orders: "My orders", none: "You have no orders yet.", total: "Total", view: "View order",
  logout: "Log out", needLogin: "Please log in to see your account.", login: "Log in",
  loading: "Loading…", back: "← Back to shop", shop: "Start shopping",
  slow: "The server did not answer. Please check your internet and refresh.",
  nameBad: "Please enter your full name.", phoneBad: "Please enter a valid phone number.",
};
const ro: typeof en = {
  title: "Mera account", email: "Email", profile: "Meri tafseel", name: "Poora naam", phone: "Phone number",
  wa: "WhatsApp number (zaroori nahi)", save: "Tafseel save karein", saving: "Save ho raha hai…", saved: "Tafseel save ho gayi.",
  orders: "Mere orders", none: "Abhi aap ka koi order nahi.", total: "Total", view: "Order dekhein",
  logout: "Logout", needLogin: "Account dekhne ke liye login karein.", login: "Login karein",
  loading: "Intezar karein…", back: "← Dukaan par wapas", shop: "Khareedari shuru karein",
  slow: "Server ne jawab nahi diya. Internet check karke refresh karein.",
  nameBad: "Apna poora naam likhein.", phoneBad: "Sahi phone number likhein.",
};
const ur: typeof en = {
  title: "میرا اکاؤنٹ", email: "ای میل", profile: "میری تفصیل", name: "پورا نام", phone: "فون نمبر",
  wa: "واٹس ایپ نمبر (اختیاری)", save: "تفصیل محفوظ کریں", saving: "محفوظ ہو رہا ہے…", saved: "تفصیل محفوظ ہو گئی۔",
  orders: "میرے آرڈرز", none: "ابھی آپ کا کوئی آرڈر نہیں۔", total: "کل", view: "آرڈر دیکھیں",
  logout: "لاگ آؤٹ", needLogin: "اکاؤنٹ دیکھنے کے لیے لاگ ان کریں۔", login: "لاگ ان کریں",
  loading: "انتظار کریں…", back: "← دکان پر واپس", shop: "خریداری شروع کریں",
  slow: "سرور نے جواب نہیں دیا۔ انٹرنیٹ چیک کر کے ریفریش کریں۔",
  nameBad: "اپنا پورا نام لکھیں۔", phoneBad: "درست فون نمبر لکھیں۔",
};

export const a: Record<AL, typeof en> = { en, ro, ur };
