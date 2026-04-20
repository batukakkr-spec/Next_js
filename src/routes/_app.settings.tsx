import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings as SettingsIcon, Globe, Lock, LogOut, Mail, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

type Lang = "en" | "mn";

const T = {
  en: {
    tag: "▸ System Settings",
    title: "SETTINGS",
    sub: "Configure your hunter system",
    langTitle: "LANGUAGE",
    langDesc: "Choose interface language",
    en: "English",
    mn: "Монгол",
    accountTitle: "ACCOUNT",
    email: "Email",
    pwTitle: "CHANGE PASSWORD",
    newPw: "New password",
    confirmPw: "Confirm password",
    updatePw: "Update password",
    pwMin: "Password must be at least 6 characters",
    pwMismatch: "Passwords do not match",
    pwOk: "Password updated",
    sessionTitle: "SESSION",
    signOut: "Sign out",
    dangerTitle: "DANGER ZONE",
    dangerDesc: "Permanently delete all of your quest progress (XP logs, quest history). Profile remains.",
    wipe: "Wipe my progress",
    wipeOk: "Progress wiped",
    confirmWipe: "Are you sure? This cannot be undone.",
    saved: "Saved",
  },
  mn: {
    tag: "▸ Системийн тохиргоо",
    title: "ТОХИРГОО",
    sub: "Hunter системээ тохируулна уу",
    langTitle: "ХЭЛ",
    langDesc: "Интерфэйсийн хэлийг сонгох",
    en: "English",
    mn: "Монгол",
    accountTitle: "БҮРТГЭЛ",
    email: "Имэйл",
    pwTitle: "НУУЦ ҮГ СОЛИХ",
    newPw: "Шинэ нууц үг",
    confirmPw: "Нууц үг давтах",
    updatePw: "Нууц үг шинэчлэх",
    pwMin: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой",
    pwMismatch: "Нууц үг таарахгүй байна",
    pwOk: "Нууц үг шинэчлэгдлээ",
    sessionTitle: "СЕССИЙ",
    signOut: "Гарах",
    dangerTitle: "АЮУЛТАЙ БҮС",
    dangerDesc: "Quest түүх, XP лог зэрэг бүх ахицыг бүрмөсөн устгана. Профайл хэвээр үлдэнэ.",
    wipe: "Ахицыг устгах",
    wipeOk: "Ахиц устгагдлаа",
    confirmWipe: "Итгэлтэй байна уу? Энэ үйлдэл буцаагдахгүй.",
    saved: "Хадгалагдлаа",
  },
};

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>(() => (typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang) || "en" : "en"));
  const t = T[lang];

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("lang", lang);
  }, [lang]);

  const switchLang = (l: Lang) => {
    setLang(l);
    toast.success(T[l].saved);
  };

  const updatePassword = async () => {
    if (pw.length < 6) return toast.error(t.pwMin);
    if (pw !== pw2) return toast.error(t.pwMismatch);
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSavingPw(false);
    if (error) return toast.error(error.message);
    setPw(""); setPw2("");
    toast.success(t.pwOk);
  };

  const wipeProgress = async () => {
    if (!user) return;
    if (!confirm(t.confirmWipe)) return;
    setWiping(true);
    const [a, b, c] = await Promise.all([
      supabase.from("xp_logs").delete().eq("user_id", user.id),
      supabase.from("user_quests").delete().eq("user_id", user.id),
      supabase.from("user_achievements").delete().eq("user_id", user.id),
    ]);
    setWiping(false);
    const err = a.error || b.error || c.error;
    if (err) return toast.error(err.message);
    toast.success(t.wipeOk);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="space-y-6 animate-float-up max-w-2xl">
      <div className="glass-panel frame-corner p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">{t.tag}</p>
        <h1 className="text-3xl font-bold glow-text mt-1 flex items-center gap-3">
          <SettingsIcon className="w-7 h-7" /> {t.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t.sub}</p>
      </div>

      {/* Language */}
      <div className="glass-panel frame-corner p-6 space-y-3">
        <h3 className="font-bold tracking-wider flex items-center gap-2"><Globe className="w-4 h-4" /> {t.langTitle}</h3>
        <p className="text-xs text-muted-foreground">{t.langDesc}</p>
        <div className="flex gap-2">
          {(["en", "mn"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              className={`px-4 py-2 rounded-md text-sm font-semibold border transition ${
                lang === l
                  ? "btn-glow border-primary/60"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {l === "en" ? "🇬🇧 English" : "🇲🇳 Монгол"}
            </button>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="glass-panel frame-corner p-6 space-y-3">
        <h3 className="font-bold tracking-wider flex items-center gap-2"><Mail className="w-4 h-4" /> {t.accountTitle}</h3>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">{t.email}</label>
          <input
            value={user?.email ?? ""}
            disabled
            className="w-full bg-input/40 border border-border rounded-md px-3 py-2 text-sm opacity-70"
          />
        </div>
      </div>

      {/* Password */}
      <div className="glass-panel frame-corner p-6 space-y-4">
        <h3 className="font-bold tracking-wider flex items-center gap-2"><Lock className="w-4 h-4" /> {t.pwTitle}</h3>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">{t.newPw}</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full bg-input/60 border border-border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">{t.confirmPw}</label>
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className="w-full bg-input/60 border border-border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={updatePassword}
          disabled={savingPw}
          className="btn-glow px-5 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
        >
          {savingPw ? "…" : t.updatePw}
        </button>
      </div>

      {/* Session */}
      <div className="glass-panel frame-corner p-6 space-y-3">
        <h3 className="font-bold tracking-wider">{t.sessionTitle}</h3>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold border border-border bg-secondary/40 hover:text-destructive transition"
        >
          <LogOut className="w-4 h-4" /> {t.signOut}
        </button>
      </div>

      {/* Danger */}
      <div className="glass-panel frame-corner p-6 space-y-3 border-destructive/40">
        <h3 className="font-bold tracking-wider text-destructive flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> {t.dangerTitle}
        </h3>
        <p className="text-xs text-muted-foreground">{t.dangerDesc}</p>
        <button
          onClick={wipeProgress}
          disabled={wiping}
          className="px-5 py-2 rounded-md text-sm font-semibold border border-destructive/50 text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
        >
          {wiping ? "…" : t.wipe}
        </button>
      </div>
    </div>
  );
}
