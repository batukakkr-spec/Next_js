import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Sword, LayoutDashboard, Trophy, Medal, User, Sparkles, Shield, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/quests", label: "Quests", icon: Sword },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/achievements", label: "Achievements", icon: Medal },
  { to: "/ai", label: "AI Planner", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, hasRole, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const xpPct = profile ? Math.min(100, (profile.xp / profile.xp_to_next) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-border glass-panel rounded-none lg:rounded-r-2xl flex flex-col">
        <div className="p-5 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md btn-glow flex items-center justify-center">
              <Sword className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold glow-text tracking-widest">LEVELING</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">System</p>
            </div>
          </Link>
        </div>

        {profile && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground mb-1">
              <span>Lv. {profile.level}</span>
              <span>{profile.xp} / {profile.xp_to_next} XP</span>
            </div>
            <div className="xp-bar"><div style={{ width: `${xpPct}%` }} /></div>
            <p className="mt-2 text-sm font-semibold">{profile.display_name ?? profile.username}</p>
            <p className="text-xs text-muted-foreground">🔥 {profile.streak_days} day streak</p>
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
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition whitespace-nowrap",
                  active
                    ? "bg-accent/30 text-foreground border border-primary/40 shadow-[0_0_12px_oklch(0.78_0.22_230/0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {hasRole("admin") && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition whitespace-nowrap",
                loc.pathname.startsWith("/admin")
                  ? "bg-accent/30 text-foreground border border-primary/40"
                  : "text-warning hover:bg-secondary/50"
              )}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        <button
          onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
          className="m-3 flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-secondary/50 transition"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </aside>

      <main className="flex-1 p-4 lg:p-8 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
