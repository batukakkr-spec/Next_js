import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Trophy, Medal, User, Sparkles, Shield, Settings, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import appLogo from "@/assets/app-logo.png";

const navItems = [
  { to: "/dashboard", label: "Status Window", icon: LayoutDashboard },
  { to: "/quests", label: "Daily Quests", icon: Swords },
  { to: "/leaderboard", label: "Hunter Ranks", icon: Trophy },
  { to: "/achievements", label: "Achievements", icon: Medal },
  { to: "/ai", label: "AI Trainer", icon: Sparkles },
  { to: "/profile", label: "Hunter Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, hasRole } = useAuth();
  const loc = useLocation();

  const xpPct = profile ? Math.min(100, (profile.xp / profile.xp_to_next) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      <div className="pointer-events-none fixed inset-0 scanline opacity-40 z-0" />
      {/* Sidebar */}
      <aside className="relative z-10 lg:w-72 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-primary/30 flex flex-col bg-[oklch(0.10_0.04_255/0.85)] backdrop-blur-xl">
        <div className="p-5 border-b border-primary/20">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src={appLogo}
              alt="Хүчтрек logo"
              className="w-11 h-11 object-contain drop-shadow-[0_0_12px_oklch(0.78_0.22_230/0.7)]"
            />
            <div>
              <h1 className="text-lg font-bold glow-text tracking-[0.25em]">ХҮЧТРЕК</h1>
              <p className="text-[10px] system-label text-primary-glow/80">▸ Hunter System v2</p>
            </div>
          </Link>
        </div>

        {profile && (
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center justify-between text-[10px] system-label mb-2">
              <span className="text-primary-glow">LV. {profile.level}</span>
              <span className="text-muted-foreground">{profile.xp} / {profile.xp_to_next} XP</span>
            </div>
            <div className="xp-bar"><div style={{ width: `${xpPct}%` }} /></div>
            <p className="mt-3 text-sm font-bold tracking-wider">{profile.display_name ?? profile.username}</p>
            <p className="text-[10px] system-label text-warning">▸ {profile.streak_days}d STREAK</p>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-x-auto lg:overflow-x-visible flex lg:flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = loc.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm transition whitespace-nowrap hex-cut tracking-wider uppercase",
                  active
                    ? "bg-primary/15 text-primary-glow border border-primary/60 shadow-[0_0_18px_oklch(0.85_0.22_215/0.4)]"
                    : "text-muted-foreground hover:text-primary-glow hover:bg-primary/5 border border-transparent"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          {hasRole("admin") && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm transition whitespace-nowrap hex-cut tracking-wider uppercase",
                loc.pathname.startsWith("/admin")
                  ? "bg-warning/20 text-warning border border-warning/60"
                  : "text-warning/80 hover:bg-warning/10 border border-transparent"
              )}
            >
              <Shield className="w-4 h-4" />
              <span className="text-xs">Admin Console</span>
            </Link>
          )}
        </nav>
      </aside>

      <main className="relative z-10 flex-1 p-4 lg:p-8 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
