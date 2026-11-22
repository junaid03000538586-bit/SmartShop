"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/browser";
import { ui, type L } from "@/lib/ui";

type Mode = "login" | "register" | "forgot" | "recover";

export default function LoginForm({ lang }: { lang: L }) {
  const t = ui[lang] ?? ui.en;
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => {
      setUser(session?.user.email ?? null);
      if (ev === "PASSWORD_RECOVERY") setMode("recover");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function go(m: Mode) { setMode(m); setErr(""); setMsg(""); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (mode === "register") {
      if (name.trim().length < 2) return setErr(t.nameBad);
      if (phone.replace(/\D/g, "").length < 10) return setErr(t.phoneBad);
    }
    if ((mode === "register" || mode === "recover") && password.length < 8) return setErr(t.passwordShort);
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setErr(error.message);
      setPassword("");
    } else if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { full_name: name.trim(), phone: phone.trim() } },
      });
      if (error) setErr(error.message);
      else if (!data.session) { setMsg(t.checkEmail); setMode("login"); }
      setPassword("");
    } else if (mode === "forgot") {
      await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/login" });
      setMsg(t.resetSent);
    } else {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setErr(error.message);
      else { setMsg(t.passwordSaved); setMode("login"); }
      setPassword("");
    }
    setBusy(false);
  }

  const css = (
    <style>{`
      .lg{max-width:460px;margin:0 auto;padding:16px}
      .lg h1{font-family:Georgia,serif;color:#0b1f3a}
      .lg input{width:100%;min-height:48px;padding:10px 14px;margin:6px 0 14px;border:1px solid #cfcac0;border-radius:12px;font:inherit;background:#fff}
      .lg label{font-weight:600;font-size:.9rem}
      .lg .go{width:100%;min-height:50px;border:0;border-radius:999px;background:#c9a24b;color:#0b1f3a;font:inherit;font-weight:700}
      .lg .go:disabled{opacity:.5}
      .lg .lnk{display:block;width:100%;min-height:44px;background:none;border:0;color:#0b1f3a;font:inherit;text-decoration:underline}
      .lg .note{background:#fbf3dc;border-radius:12px;padding:10px 14px;margin:12px 0}
      .lg .bad{background:#fde8e6;color:#8a1c12;border-radius:12px;padding:10px 14px;margin:12px 0}
    `}</style>
  );

  if (user && mode !== "recover") {
    return (
      <main className="lg">
        {css}
        <h1>{t.loggedInAs}</h1>
        <p>{user}</p>
        {msg && <div className="note">{msg}</div>}
        <a className="btn" href="/">{t.back}</a>
        <button className="lnk" onClick={() => supabase.auth.signOut()}>{t.logout}</button>
      </main>
    );
  }

  const title = mode === "register" ? t.register : mode === "forgot" ? t.forgot : mode === "recover" ? t.newPassword : t.login;
  const label = busy ? t.wait : mode === "register" ? t.register : mode === "forgot" ? t.sendReset : mode === "recover" ? t.saveNewPassword : t.login;

  return (
    <main className="lg">
      {css}
      <h1>{title}</h1>
      {msg && <div className="note">{msg}</div>}
      {err && <div className="bad">{err}</div>}
      <form onSubmit={submit}>
        {mode === "register" && (
          <>
            <label>{t.fullName}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <label>{t.phone}</label>
            <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </>
        )}
        {mode !== "recover" && (
          <>
            <label>{t.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </>
        )}
        {mode !== "forgot" && (
          <>
            <label>{mode === "recover" ? t.newPassword : t.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"} required />
          </>
        )}
        <button className="go" disabled={busy}>{label}</button>
      </form>
      {mode === "login" && (
        <>
          <button type="button" className="lnk" onClick={() => go("forgot")}>{t.forgot}</button>
          <button type="button" className="lnk" onClick={() => go("register")}>{t.noAccount}</button>
        </>
      )}
      {mode === "register" && <button type="button" className="lnk" onClick={() => go("login")}>{t.haveAccount}</button>}
      {mode === "forgot" && <button type="button" className="lnk" onClick={() => go("login")}>{t.backToLogin}</button>}
    </main>
  );
}
