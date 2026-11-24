export type AdL = "en" | "ro" | "ur";

const en = {
  title: "Saved addresses", add: "Add address", edit: "Edit", del: "Delete", confirmDel: "Delete this address?",
  none: "You have no saved addresses yet.", label: "Label (optional, e.g. Home)", name: "Full name",
  phone: "Phone number", city: "City", address: "Complete address", postal: "Postal code (optional)",
  def: "Make this my default address", defTag: "Default", makeDef: "Make default", save: "Save address",
  saving: "Saving…", cancel: "Cancel", saved: "Address saved.", deleted: "Address deleted.",
  nameBad: "Please enter your full name.", phoneBad: "Please enter a valid phone number.",
  cityBad: "Please enter your city.", addrBad: "Please enter your complete address.",
  slow: "The server did not answer. Please check your internet and try again.",
  use: "Use a saved address", newAddr: "Enter a new address", remember: "Save this address for next time",
};
const ro: typeof en = {
  title: "Saved addresses", add: "Address add karein", edit: "Edit", del: "Delete", confirmDel: "Ye address delete karein?",
  none: "Abhi koi address save nahi hai.", label: "Naam (zaroori nahi, jaise Ghar)", name: "Poora naam",
  phone: "Phone number", city: "Shehar", address: "Poora pata", postal: "Postal code (zaroori nahi)",
  def: "Isay mera default address banayein", defTag: "Default", makeDef: "Default banayein", save: "Address save karein",
  saving: "Save ho raha hai…", cancel: "Cancel", saved: "Address save ho gaya.", deleted: "Address delete ho gaya.",
  nameBad: "Apna poora naam likhein.", phoneBad: "Sahi phone number likhein.",
  cityBad: "Apna shehar likhein.", addrBad: "Poora pata likhein.",
  slow: "Server ne jawab nahi diya. Internet check karke dobara try karein.",
  use: "Saved address istemal karein", newAddr: "Naya address likhein", remember: "Ye address agli baar ke liye save karein",
};
const ur: typeof en = {
  title: "محفوظ پتے", add: "پتہ شامل کریں", edit: "ترمیم", del: "حذف کریں", confirmDel: "یہ پتہ حذف کریں؟",
  none: "ابھی کوئی پتہ محفوظ نہیں۔", label: "نام (اختیاری، جیسے گھر)", name: "پورا نام",
  phone: "فون نمبر", city: "شہر", address: "مکمل پتہ", postal: "پوسٹل کوڈ (اختیاری)",
  def: "اسے میرا ڈیفالٹ پتہ بنائیں", defTag: "ڈیفالٹ", makeDef: "ڈیفالٹ بنائیں", save: "پتہ محفوظ کریں",
  saving: "محفوظ ہو رہا ہے…", cancel: "منسوخ", saved: "پتہ محفوظ ہو گیا۔", deleted: "پتہ حذف ہو گیا۔",
  nameBad: "اپنا پورا نام لکھیں۔", phoneBad: "درست فون نمبر لکھیں۔",
  cityBad: "اپنا شہر لکھیں۔", addrBad: "مکمل پتہ لکھیں۔",
  slow: "سرور نے جواب نہیں دیا۔ انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔",
  use: "محفوظ پتہ استعمال کریں", newAddr: "نیا پتہ لکھیں", remember: "یہ پتہ اگلی بار کے لیے محفوظ کریں",
};

export const ad: Record<AdL, typeof en> = { en, ro, ur };
