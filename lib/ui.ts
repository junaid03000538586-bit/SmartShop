export type L = "en" | "ro" | "ur";

const en = {
  login: "Log in", register: "Create account", logout: "Log out",
  email: "Email", password: "Password", fullName: "Full name", phone: "Phone number",
  forgot: "Forgot password?", sendReset: "Send reset link",
  resetSent: "If this email has an account, a reset link has been sent.",
  newPassword: "New password", saveNewPassword: "Save new password",
  haveAccount: "Already have an account? Log in", noAccount: "New here? Create an account",
  backToLogin: "Back to log in",
  checkEmail: "Account created. Please check your email to confirm, then log in.",
  passwordShort: "Password must be at least 8 characters.",
  phoneBad: "Please enter a valid phone number.", nameBad: "Please enter your full name.",
  loggedInAs: "Logged in as", passwordSaved: "Password updated.",
  back: "← Back to shop", wait: "Please wait…",
};

const ro: typeof en = {
  login: "Login karein", register: "Account banayein", logout: "Logout",
  email: "Email", password: "Password", fullName: "Poora naam", phone: "Phone number",
  forgot: "Password bhool gaye?", sendReset: "Reset link bhejein",
  resetSent: "Agar is email ka account hai to reset link bhej diya gaya hai.",
  newPassword: "Naya password", saveNewPassword: "Naya password save karein",
  haveAccount: "Pehle se account hai? Login karein", noAccount: "Naye hain? Account banayein",
  backToLogin: "Login par wapas",
  checkEmail: "Account ban gaya. Apni email check karke confirm karein, phir login karein.",
  passwordShort: "Password kam az kam 8 harf ka hona chahiye.",
  phoneBad: "Sahi phone number likhein.", nameBad: "Apna poora naam likhein.",
  loggedInAs: "Login hain:", passwordSaved: "Password badal gaya.",
  back: "← Dukaan par wapas", wait: "Intezar karein…",
};

const ur: typeof en = {
  login: "لاگ ان کریں", register: "اکاؤنٹ بنائیں", logout: "لاگ آؤٹ",
  email: "ای میل", password: "پاس ورڈ", fullName: "پورا نام", phone: "فون نمبر",
  forgot: "پاس ورڈ بھول گئے؟", sendReset: "ری سیٹ لنک بھیجیں",
  resetSent: "اگر اس ای میل کا اکاؤنٹ ہے تو ری سیٹ لنک بھیج دیا گیا ہے۔",
  newPassword: "نیا پاس ورڈ", saveNewPassword: "نیا پاس ورڈ محفوظ کریں",
  haveAccount: "پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں", noAccount: "نئے ہیں؟ اکاؤنٹ بنائیں",
  backToLogin: "لاگ ان پر واپس",
  checkEmail: "اکاؤنٹ بن گیا۔ اپنی ای میل چیک کر کے تصدیق کریں، پھر لاگ ان کریں۔",
  passwordShort: "پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔",
  phoneBad: "درست فون نمبر لکھیں۔", nameBad: "اپنا پورا نام لکھیں۔",
  loggedInAs: "لاگ ان ہیں:", passwordSaved: "پاس ورڈ تبدیل ہو گیا۔",
  back: "← دکان پر واپس", wait: "انتظار کریں…",
};

export const ui: Record<L, typeof en> = { en, ro, ur };
