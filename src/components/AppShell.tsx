"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Trophy,
  Medal,
  User,
  Users,
  Sparkles,
  Shield,
  Settings,
  Swords,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/lib/language";
import {
  getHunterRank,
  getHunterRankClass,
  getLevelProgressPercent,
  getLevelProgressText,
  isMaxHunterLevel,
} from "@/lib/hunter-rank";
import { cn } from "@/lib/utils";

const NAV_LABELS = {
  en: {
    dashboard: "Status Window",
    quests: "Daily Quests",
    leaderboard: "Hunter Ranks",
    achievements: "Achievements",
    ai: "AI Trainer",
    profile: "Hunter Profile",
    settings: "Settings",
    adminMode: "Admin Operations Mode",
    controlAccess: "WEBSITE CONTROL ACCESS",
    streakSuffix: "STREAK",
    adminConsole: "Admin Console",
    userManagement: "User Management",
    questManagement: "Quest Management",
    leaderboardAdmin: "Leaderboard",
  },
  mn: {
    dashboard: "Төлвийн Самбар",
    quests: "Өдрийн Даалгавар",
    leaderboard: "Анчны Зэрэглэл",
    achievements: "Амжилтууд",
    ai: "AI Туслах",
    profile: "Анчны Профайл",
    settings: "Тохиргоо",
    adminMode: "Админ Удирдлагын Горим",
    controlAccess: "ВЭБСАЙТЫН ХЯНАЛТЫН ЭРХ",
    streakSuffix: "ӨДРИЙН ЦУВРАЛ",
    adminConsole: "Админ Удирдлага",
    userManagement: "Хэрэглэгчийн Удирдлага",
    questManagement: "Даалгаврын Удирдлага",
    leaderboardAdmin: "Зэрэглэл",
  },
} as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, hasRole } = useAuth();
  const { lang } = useLanguage();
  const loc = useLocation();
  const isAdmin = hasRole("admin");
  const labels = NAV_LABELS[lang];
  const navItems = [
    { to: "/dashboard", label: labels.dashboard, icon: LayoutDashboard },
    { to: "/quests", label: labels.quests, icon: Swords },
    { to: "/leaderboard", label: labels.leaderboard, icon: Trophy },
    { to: "/achievements", label: labels.achievements, icon: Medal },
    { to: "/ai", label: labels.ai, icon: Sparkles },
    { to: "/profile", label: labels.profile, icon: User },
    { to: "/settings", label: labels.settings, icon: Settings },
  ] as const;

  const xpPct = getLevelProgressPercent(profile?.xp, profile?.xp_to_next, profile?.level);
  const hunterRank = getHunterRank(profile?.level);
  const hunterRankClass = getHunterRankClass(hunterRank);
  const visibleNavItems = isAdmin
    ? navItems.filter((item) => item.to === "/dashboard" || item.to === "/settings")
    : navItems;

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      <div className="pointer-events-none fixed inset-0 scanline opacity-40 z-0" />
      {/* Sidebar */}
      <aside className="relative z-10 flex flex-col border-b border-primary/30 bg-[oklch(0.10_0.04_255/0.85)] backdrop-blur-xl lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
        <div className="border-b border-primary/20 p-4 sm:p-5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <BrandLogo size="sm" />
          </Link>
        </div>

        {profile && (
          <div className="border-b border-primary/20 p-4">
            {isAdmin ? (
              <div className="rounded-md border border-primary/35 bg-primary/10 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-primary-glow shadow-[0_0_18px_oklch(0.78_0.18_300/0.12)]">
                {labels.adminMode}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-[10px] system-label mb-2">
                  <span className="text-primary-glow">
                    LV. {profile.level}
                    {isMaxHunterLevel(profile.level) ? " MAX" : ""}
                  </span>
                  <span className="text-muted-foreground">
                    {getLevelProgressText(profile.xp, profile.xp_to_next, profile.level)}
                  </span>
                </div>
                <div className="xp-bar">
                  <div style={{ width: `${xpPct}%` }} />
                </div>
              </>
            )}
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-sm font-bold tracking-wider">
                {profile.display_name ?? profile.username}
              </p>
              {isAdmin ? (
                <span className="inline-flex items-center justify-center rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-black tracking-widest text-primary-glow shadow-[0_0_14px_oklch(0.78_0.18_300/0.16)]">
                  ADMIN
                </span>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[10px] font-black tracking-widest",
                    hunterRankClass,
                  )}
                >
                  {hunterRank}
                </span>
              )}
            </div>
            <p className="text-[10px] system-label text-primary-glow/90">
              {isAdmin
                ? `▸ ${labels.controlAccess}`
                : `▸ ${profile.streak_days}d ${labels.streakSuffix}`}
            </p>
          </div>
        )}

        <nav className="flex flex-1 gap-1 overflow-x-auto px-2 py-3 lg:flex-col lg:gap-0 lg:space-y-1 lg:overflow-x-visible lg:p-3">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = loc.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm transition whitespace-nowrap hex-cut tracking-wider uppercase lg:gap-3",
                  active
                    ? "bg-primary/15 text-primary-glow border border-primary/60 shadow-[0_0_18px_oklch(0.85_0.22_215/0.4)]"
                    : "text-muted-foreground hover:text-primary-glow hover:bg-primary/5 border border-transparent",
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          {hasRole("admin") && (
            <>
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm transition whitespace-nowrap hex-cut tracking-wider uppercase lg:gap-3",
                  loc.pathname.startsWith("/admin") &&
                    !loc.pathname.startsWith("/admin-quests") &&
                    !loc.pathname.startsWith("/admin-users")
                    ? "border border-primary/55 bg-[linear-gradient(90deg,oklch(0.24_0.08_285/0.95),oklch(0.33_0.12_300/0.9))] text-primary-glow shadow-[0_0_18px_oklch(0.8_0.2_304/0.2)]"
                    : "text-primary-glow/80 hover:bg-primary/10 hover:text-primary-glow border border-transparent",
                )}
              >
                <Shield className="w-4 h-4" />
                <span className="text-xs">{labels.adminConsole}</span>
              </Link>
              <Link
                to="/admin-users"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm transition whitespace-nowrap hex-cut tracking-wider uppercase lg:gap-3",
                  loc.pathname.startsWith("/admin-users")
                    ? "border border-primary/55 bg-[linear-gradient(90deg,oklch(0.24_0.08_285/0.95),oklch(0.33_0.12_300/0.9))] text-primary-glow shadow-[0_0_18px_oklch(0.8_0.2_304/0.2)]"
                    : "text-primary-glow/80 hover:bg-primary/10 hover:text-primary-glow border border-transparent",
                )}
              >
                <Users className="w-4 h-4" />
                <span className="text-xs">{labels.userManagement}</span>
              </Link>
              <Link
                to="/admin-quests"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm transition whitespace-nowrap hex-cut tracking-wider uppercase lg:gap-3",
                  loc.pathname.startsWith("/admin-quests")
                    ? "border border-primary/55 bg-[linear-gradient(90deg,oklch(0.24_0.08_285/0.95),oklch(0.33_0.12_300/0.9))] text-primary-glow shadow-[0_0_18px_oklch(0.8_0.2_304/0.2)]"
                    : "text-primary-glow/80 hover:bg-primary/10 hover:text-primary-glow border border-transparent",
                )}
              >
                <Swords className="w-4 h-4" />
                <span className="text-xs">{labels.questManagement}</span>
              </Link>
              <Link
                to="/leaderboard"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm transition whitespace-nowrap hex-cut tracking-wider uppercase lg:gap-3",
                  loc.pathname.startsWith("/leaderboard")
                    ? "border border-primary/55 bg-[linear-gradient(90deg,oklch(0.24_0.08_285/0.95),oklch(0.33_0.12_300/0.9))] text-primary-glow shadow-[0_0_18px_oklch(0.8_0.2_304/0.2)]"
                    : "text-primary-glow/80 hover:bg-primary/10 hover:text-primary-glow border border-transparent",
                )}
              >
                <Trophy className="w-4 h-4" />
                <span className="text-xs">{labels.leaderboardAdmin}</span>
              </Link>
            </>
          )}
        </nav>
      </aside>

      <main className="relative z-10 max-w-full flex-1 overflow-x-hidden p-3 sm:p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
