"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, type Lang } from "@/lib/language";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
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
    dangerDesc: "Бүх quest түүх, XP лог болон амжилтыг бүрмөсөн устгана. Профайл хэвээр үлдэнэ.",
    wipe: "Ахицыг устгах",
    wipeOk: "Ахиц устгагдлаа",
    confirmWipe: "Үнэхээр итгэлтэй байна уу? Энэ үйлдэл буцаагдахгүй.",
    saved: "Хадгалагдлаа",
  },
};

function SectionCard({
  icon: Icon,
  title,
  desc,
  children,
  danger = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 sm:p-4 ${
        danger ? "border-destructive/40" : "border-border"
      }`}
    >
      <div className="mb-3 flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
            danger
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-border bg-secondary text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`text-sm font-semibold ${danger ? "text-destructive" : "text-foreground"}`}
          >
            {title}
          </h3>
          {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const t = T[lang];

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
    if (!user) {
      toast.error("Authentication required");
      return;
    }
    if (!window.confirm(t.confirmWipe)) return;

    setWiping(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("Session expired. Please sign in again.");
        return;
      }

      const response = await fetch("/api/profile/wipe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = (await response.json()) as { error?: string; ok?: boolean };
      if (!response.ok) {
        toast.error(result.error ?? "Failed to wipe progress");
        return;
      }

      await refreshProfile();
      toast.success(t.wipeOk);
    } finally {
      setWiping(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center space-y-2">
      <div className="flex w-full max-w-5xl items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.sub}</p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-2 lg:grid-cols-2">
        <div className="space-y-2">
          <SectionCard icon={Languages} title={t.langTitle} desc={t.langDesc}>
            <div className="grid grid-cols-2 gap-2">
              {(["en", "mn"] as Lang[]).map((l) => {
                const active = lang === l;
                return (
                  <button
                    key={l}
                    onClick={() => switchLang(l)}
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      active
                        ? "border-foreground bg-secondary"
                        : "border-border bg-background hover:bg-secondary/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{l === "en" ? "EN" : "MN"}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium">{l === "en" ? "English" : "Монгол"}</p>
                        <p className="text-xs text-muted-foreground">{active ? t.saved : " "}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard icon={UserCircle2} title={t.accountTitle} desc={t.accountDesc}>
            <div className="space-y-2">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" /> {t.email}
                </label>
                <div className="relative">
                  <input
                    value={user?.email ?? ""}
                    disabled
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 pr-24 text-sm opacity-80"
                  />
                  <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs text-success">
                    <ShieldCheck className="w-3 h-3" /> {t.verified}
                  </span>
                </div>
              </div>
              {profile && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md border border-border bg-background p-2.5 text-center">
                    <p className="text-base font-semibold">Lv.{profile.level}</p>
                    <p className="text-[11px] text-muted-foreground">Level</p>
                  </div>
                  <div className="rounded-md border border-border bg-background p-2.5 text-center">
                    <p className="text-base font-semibold">{profile.xp}</p>
                    <p className="text-[11px] text-muted-foreground">XP</p>
                  </div>
                  <div className="rounded-md border border-border bg-background p-2.5 text-center">
                    <p className="text-base font-semibold">{profile.streak_days}</p>
                    <p className="text-[11px] text-muted-foreground">Streak</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={KeyRound} title={t.pwTitle} desc={t.pwDesc}>
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t.newPw}</label>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-primary/30 bg-[linear-gradient(180deg,oklch(0.14_0.035_286/0.98),oklch(0.09_0.025_272/1))] px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary-glow focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t.confirmPw}</label>
                <input
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-primary/30 bg-[linear-gradient(180deg,oklch(0.14_0.035_286/0.98),oklch(0.09_0.025_272/1))] px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary-glow focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <button
                onClick={updatePassword}
                disabled={savingPw || !pw}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium transition hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Lock className="w-4 h-4" />
                {savingPw ? "…" : t.updatePw}
              </button>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-2">
          <SectionCard icon={LogOut} title={t.sessionTitle} desc={t.sessionDesc}>
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="mb-2 flex items-start gap-2">
                <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-warning" />
                <p className="text-xs text-muted-foreground">{t.signOutHint}</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-4 py-2 text-sm font-medium text-warning transition hover:bg-warning/15 disabled:opacity-50 sm:w-auto"
              >
                <LogOut className="w-4 h-4" />
                <span>{signingOut ? "…" : t.signOut}</span>
              </button>
            </div>
          </SectionCard>

          <SectionCard icon={Trash2} title={t.dangerTitle} desc={t.dangerDesc} danger>
            <button
              onClick={wipeProgress}
              disabled={wiping}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/15 disabled:opacity-50 sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              {wiping ? "…" : t.wipe}
            </button>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
