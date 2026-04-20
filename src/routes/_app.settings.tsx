import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Globe,
  Lock,
  LogOut,
  Mail,
  Trash2,
  ShieldCheck,
  Languages,
  KeyRound,
  UserCircle2,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

type Lang = "en" | "mn";

const T = {
  en: {
    tag: "▸ System Configuration",
    title: "SETTINGS",
    sub: "Tune your hunter system to perfection",
    langTitle: "LANGUAGE",
    langDesc: "Choose your interface language",
    accountTitle: "ACCOUNT",
    accountDesc: "Your hunter identification",
    email: "Email address",
    verified: "Verified",
    pwTitle: "SECURITY",
    pwDesc: "Update your access credentials",
    newPw: "New password",
    confirmPw: "Confirm password",
    updatePw: "Update password",
    pwMin: "Password must be at least 6 characters",
    pwMismatch: "Passwords do not match",
    pwOk: "Password updated",
    sessionTitle: "SESSION",
    sessionDesc: "End your current hunter session",
    signOut: "Sign out of system",
    signOutHint: "You will need to sign in again to access your quests",
    dangerTitle: "DANGER ZONE",
    dangerDesc:
      "Permanently erase all quest progress, XP logs and achievements. Your profile remains intact.",
    wipe: "Wipe my progress",
    wipeOk: "Progress wiped",
    confirmWipe: "Are you absolutely sure? This cannot be undone.",
    saved: "Saved",
  },
  mn: {
    tag: "▸ Системийн тохиргоо",
    title: "ТОХИРГОО",
    sub: "Hunter системээ төгс болгож тохируулна уу",
    langTitle: "ХЭЛ",
    langDesc: "Интерфэйсийн хэлээ сонгоно уу",
    accountTitle: "БҮРТГЭЛ",
    accountDesc: "Hunter таних мэдээлэл",
    email: "И-мэйл хаяг",
    verified: "Баталгаажсан",
    pwTitle: "АЮУЛГҮЙ БАЙДАЛ",
    pwDesc: "Нэвтрэх мэдээллээ шинэчлэх",
    newPw: "Шинэ нууц үг",
    confirmPw: "Нууц үг давтах",
    updatePw: "Нууц үг шинэчлэх",
    pwMin: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой",
    pwMismatch: "Нууц үг таарахгүй байна",
    pwOk: "Нууц үг шинэчлэгдлээ",
    sessionTitle: "СЕССИЙ",
    sessionDesc: "Одоогийн hunter сессээ дуусгах",
    signOut: "Системээс гарах",
    signOutHint: "Дахин нэвтрэхийн тулд email-ээ оруулах шаардлагатай",
    dangerTitle: "АЮУЛТАЙ БҮС",
    dangerDesc:
      "Бүх quest түүх, XP лог болон амжилтыг бүрмөсөн устгана. Профайл хэвээр үлдэнэ.",
    wipe: "Ахицыг устгах",
    wipeOk: "Ахиц устгагдлаа",
    confirmWipe: "Үнэхээр итгэлтэй байна уу? Энэ үйлдэл буцаагдахгүй.",
    saved: "Хадгалагдлаа",
  },
};

function SectionCard({
  icon: Icon,
  iconColor = "text-primary-glow",
  title,
  desc,
  children,
  danger = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`relative glass-panel frame-corner p-6 transition hover:shadow-[0_0_30px_oklch(0.78_0.22_230/0.15)] ${
        danger ? "border-destructive/40" : ""
      }`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-11 h-11 rounded-lg flex items-center justify-center border ${
            danger
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-primary/40 bg-accent/20 " + iconColor
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-bold tracking-[0.2em] text-sm ${
              danger ? "text-destructive" : "text-foreground"
            }`}
          >
            {title}
          </h3>
          {desc && (
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>(() =>
    typeof window !== "undefined"
      ? ((localStorage.getItem("lang") as Lang) || "en")
      : "en",
  );
  const t = T[lang];

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
    setPw("");
    setPw2("");
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
    setSigningOut(true);
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="space-y-6 animate-float-up max-w-3xl">
      {/* Hero */}
      <div className="relative glass-panel frame-corner p-8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 20% 0%, oklch(0.78 0.22 230 / 0.4), transparent 60%), radial-gradient(circle at 80% 100%, oklch(0.55 0.22 260 / 0.3), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl btn-glow flex items-center justify-center animate-pulse-glow">
            <SettingsIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-primary-glow">
              {t.tag}
            </p>
            <h1 className="text-4xl font-bold glow-text mt-1 tracking-wider">
              {t.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t.sub}</p>
          </div>
        </div>
      </div>

      {/* Language */}
      <SectionCard icon={Languages} title={t.langTitle} desc={t.langDesc}>
        <div className="grid grid-cols-2 gap-3">
          {(["en", "mn"] as Lang[]).map((l) => {
            const active = lang === l;
            return (
              <button
                key={l}
                onClick={() => switchLang(l)}
                className={`relative p-4 rounded-lg border-2 transition group overflow-hidden ${
                  active
                    ? "border-primary/60 bg-accent/20 shadow-[0_0_20px_oklch(0.78_0.22_230/0.3)]"
                    : "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {l === "en" ? "🇬🇧" : "🇲🇳"}
                  </span>
                  <div className="text-left">
                    <p
                      className={`font-bold text-sm tracking-wider ${
                        active ? "glow-text" : ""
                      }`}
                    >
                      {l === "en" ? "English" : "Монгол"}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {l === "en" ? "EN" : "MN"}
                    </p>
                  </div>
                </div>
                {active && (
                  <div className="absolute top-2 right-2">
                    <Globe className="w-4 h-4 text-primary-glow" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Account */}
      <SectionCard icon={UserCircle2} title={t.accountTitle} desc={t.accountDesc}>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> {t.email}
            </label>
            <div className="relative">
              <input
                value={user?.email ?? ""}
                disabled
                className="w-full bg-input/40 border border-border rounded-md px-3 py-2.5 pr-24 text-sm font-mono opacity-80"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] uppercase tracking-wider text-success">
                <ShieldCheck className="w-3 h-3" /> {t.verified}
              </span>
            </div>
          </div>
          {profile && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="text-center p-2 rounded-md bg-secondary/30 border border-border">
                <p className="text-lg font-bold glow-text">Lv.{profile.level}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Level</p>
              </div>
              <div className="text-center p-2 rounded-md bg-secondary/30 border border-border">
                <p className="text-lg font-bold">{profile.xp}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">XP</p>
              </div>
              <div className="text-center p-2 rounded-md bg-secondary/30 border border-border">
                <p className="text-lg font-bold">🔥{profile.streak_days}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Streak</p>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Password */}
      <SectionCard icon={KeyRound} title={t.pwTitle} desc={t.pwDesc}>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1.5">
              {t.newPw}
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-input/60 border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary/60 focus:outline-none focus:shadow-[0_0_15px_oklch(0.78_0.22_230/0.2)] transition"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1.5">
              {t.confirmPw}
            </label>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-input/60 border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary/60 focus:outline-none focus:shadow-[0_0_15px_oklch(0.78_0.22_230/0.2)] transition"
            />
          </div>
          <button
            onClick={updatePassword}
            disabled={savingPw || !pw}
            className="btn-glow w-full sm:w-auto px-6 py-2.5 rounded-md text-sm font-bold tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {savingPw ? "…" : t.updatePw}
          </button>
        </div>
      </SectionCard>

      {/* Session — Sign out */}
      <SectionCard icon={LogOut} title={t.sessionTitle} desc={t.sessionDesc}>
        <div className="relative overflow-hidden rounded-lg border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{t.signOutHint}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="group relative w-full sm:w-auto px-6 py-3 rounded-md text-sm font-bold tracking-[0.2em] uppercase border-2 border-warning/50 text-warning bg-warning/5 hover:bg-warning/15 hover:border-warning hover:shadow-[0_0_25px_oklch(0.80_0.18_80/0.4)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 overflow-hidden"
          >
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.80 0.18 80 / 0.15), transparent)",
              }}
            />
            <LogOut className="w-4 h-4 relative" />
            <span className="relative">
              {signingOut ? "…" : t.signOut}
            </span>
          </button>
        </div>
      </SectionCard>

      {/* Danger */}
      <SectionCard icon={Trash2} title={t.dangerTitle} desc={t.dangerDesc} danger>
        <button
          onClick={wipeProgress}
          disabled={wiping}
          className="group w-full sm:w-auto px-6 py-3 rounded-md text-sm font-bold tracking-[0.2em] uppercase border-2 border-destructive/50 text-destructive bg-destructive/5 hover:bg-destructive/15 hover:border-destructive hover:shadow-[0_0_25px_oklch(0.62_0.24_25/0.4)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5"
        >
          <Trash2 className="w-4 h-4" />
          {wiping ? "…" : t.wipe}
        </button>
      </SectionCard>
    </div>
  );
}
