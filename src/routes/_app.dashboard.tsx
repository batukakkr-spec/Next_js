"use client";

import Image from "next/image";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import hunterFigure from "@/assets/hunter-avatar-purple-ring.png";
import { toast } from "sonner";
import {
  getHunterRank,
  getHunterRankClass,
  getLevelProgressPercent,
  getLevelProgressText,
  isMaxHunterLevel,
} from "@/lib/hunter-rank";
import { Flame, Shield, Sparkles, Sword, TrendingUp, Trophy } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

interface DailyQuest {
  id: string;
  status: string;
  progress: number;
  quest: {
    id: string;
    title: string;
    description: string | null;
    xp_reward: number;
    target_value: number;
    unit: string | null;
    category: string;
    difficulty: string;
  };
}

interface XpLog {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isMissingCompleteQuestRpc(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  return (
    normalized.includes("could not find the function") ||
    normalized.includes("schema cache") ||
    normalized.includes("complete_quest") ||
    normalized.includes("permission denied")
  );
}

async function completeQuestWithFallback(userId: string, uq: DailyQuest, accessToken: string) {
  const rpcResult = await supabase.rpc("complete_quest", { _user_quest_id: uq.id });
  if (!rpcResult.error) {
    return rpcResult.data;
  }

  if (!isMissingCompleteQuestRpc(rpcResult.error.message)) {
    throw rpcResult.error;
  }

  const response = await fetch("/api/quests/complete", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userQuestId: uq.id,
    }),
  });

  const result = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(result.error ?? "Failed to complete quest");
  }

  return result;
}

async function resolveActiveQuestAssignment(userId: string, uq: DailyQuest) {
  if (isUuid(uq.id)) {
    return uq;
  }

  const { data, error } = await supabase
    .from("user_quests")
    .select("id, status, progress")
    .eq("user_id", userId)
    .eq("quest_id", uq.quest.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Quest assignment is still syncing. Please try again.");
  }

  return {
    ...uq,
    id: data.id,
    status: data.status ?? uq.status,
    progress: data.progress ?? uq.progress,
  };
}

async function fetchAdminDashboardData() {
  const [
    { count: usersCount },
    { count: questsCount },
    { count: adminsCount },
    { count: activeQuestsCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("quests").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    supabase
      .from("user_quests")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  return {
    users: usersCount ?? 0,
    quests: questsCount ?? 0,
    admins: adminsCount ?? 0,
    activeQuests: activeQuestsCount ?? 0,
  };
}

async function fetchUserDashboardData(userId: string, level: number, xp: number) {
  const [
    { data: aq },
    { data: logs },
    { count },
    { count: higherLevelCount },
    { count: sameLevelHigherXpCount },
  ] = await Promise.all([
    supabase
      .from("user_quests")
      .select(
        "id, status, progress, quest:quests(id, title, description, xp_reward, target_value, unit, category, difficulty)",
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("xp_logs")
      .select("id, amount, reason, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("user_quests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gt("level", level),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("level", level)
      .gt("xp", xp),
  ]);

  const rankPosition = (higherLevelCount ?? 0) + (sameLevelHigherXpCount ?? 0) + 1;

  return {
    active: (aq as unknown as DailyQuest[]) ?? [],
    recent: (logs as XpLog[]) ?? [],
    stats: {
      completed: count ?? 0,
      totalXp: ((logs ?? []) as XpLog[]).reduce((sum, log) => sum + (log.amount ?? 0), 0),
      worldRank: rankPosition > 0 ? `#${rankPosition}` : "—",
    },
  };
}

function Dashboard() {
  const { profile, user, refreshProfile, hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const userDashboardQuery = useQuery({
    queryKey: ["dashboard", "user", user?.id ?? null],
    queryFn: () => fetchUserDashboardData(user!.id, profile?.level ?? 0, profile?.xp ?? 0),
    enabled: !!user && !isAdmin,
    staleTime: 60_000,
  });
  const adminDashboardQuery = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: fetchAdminDashboardData,
    enabled: isAdmin,
    staleTime: 60_000,
  });

  const active = userDashboardQuery.data?.active ?? [];
  const recent = userDashboardQuery.data?.recent ?? [];
  const stats = userDashboardQuery.data?.stats ?? { completed: 0, totalXp: 0, worldRank: "—" };
  const adminStats = adminDashboardQuery.data ?? {
    users: 0,
    quests: 0,
    admins: 0,
    activeQuests: 0,
  };

  const xpPct = getLevelProgressPercent(profile?.xp, profile?.xp_to_next, profile?.level);
  const hunterRank = getHunterRank(profile?.level);
  const hunterRankClass = getHunterRankClass(hunterRank);
  const refreshDashboard = useCallback(async () => {
    await refreshProfile();

    if (isAdmin) {
      await adminDashboardQuery.refetch();
      return;
    }

    await userDashboardQuery.refetch();
  }, [adminDashboardQuery, isAdmin, refreshProfile, userDashboardQuery]);
  if (isAdmin) {
    return (
      <div className="space-y-6 animate-float-up">
        <div className="glass-panel frame-corner relative overflow-hidden px-6 py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,oklch(0.58_0.18_300/0.22),transparent_24%),radial-gradient(circle_at_85%_12%,oklch(0.72_0.12_230/0.14),transparent_28%),linear-gradient(180deg,oklch(0.16_0.03_270),oklch(0.1_0.02_270))]" />
          <div className="relative z-10">
            <p className="text-[11px] uppercase tracking-[0.45em] text-primary-glow">
              ▸ Admin Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight glow-text sm:text-5xl">
              Website Operations
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Admin accounts do not use hunter quests. This view is only for monitoring users,
              quests, and overall platform activity.
            </p>
          </div>
          <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={TrendingUp} label="Users" value={String(adminStats.users)} />
            <Stat icon={Sword} label="Quests" value={String(adminStats.quests)} />
            <Stat icon={Shield} label="Admins" value={String(adminStats.admins)} />
            <Stat icon={Flame} label="Active" value={String(adminStats.activeQuests)} />
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="glass-panel frame-corner p-6 lg:col-span-2">
            <h2 className="text-xl font-bold tracking-wider">▸ ADMIN ACTIONS</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to="/admin"
                className="rounded-md border border-primary/40 bg-primary/10 p-4 transition hover:bg-primary/15"
              >
                <p className="text-sm font-semibold text-primary-glow">Open Admin Console</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Add new quests, delete users, and manage the website.
                </p>
              </Link>
              <Link
                to="/settings"
                className="rounded-md border border-border bg-secondary/20 p-4 transition hover:bg-secondary/35"
              >
                <p className="text-sm font-semibold">Admin Settings</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Update password and control your admin session.
                </p>
              </Link>
            </div>
          </div>

          <div className="glass-panel frame-corner p-6">
            <h2 className="text-xl font-bold tracking-wider">▸ ACCESS MODE</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Admin accounts cannot use daily quests.</li>
              <li>Admin accounts are for website operations only.</li>
              <li>User deletion and quest creation are in Admin Console.</li>
            </ul>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-float-up">
      <div className="glass-panel frame-corner relative overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_48%,oklch(0.48_0.2_286/0.26),transparent_18%),radial-gradient(circle_at_60%_16%,oklch(0.76_0.14_295/0.14),transparent_18%),linear-gradient(180deg,oklch(0.17_0.045_286/0.99),oklch(0.11_0.03_276/1))]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-glow/80 to-transparent" />
        <div className="relative z-10 grid items-center gap-5 lg:grid-cols-[248px_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[252px] lg:mx-0">
            <div className="relative aspect-[0.9] overflow-hidden rounded-[1.75rem] border border-primary/20 bg-[linear-gradient(180deg,oklch(0.16_0.04_286/0.98),oklch(0.1_0.025_272/1))] p-5 shadow-[inset_0_0_0_1px_oklch(0.84_0.08_300/0.06),0_0_0_1px_oklch(0.72_0.1_280/0.12),0_0_42px_oklch(0.56_0.18_292/0.18)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,oklch(0.48_0.18_292/0.28),transparent_34%),linear-gradient(180deg,transparent,oklch(0.11_0.025_272/0.64))]" />
              <div className="pointer-events-none absolute inset-[14px] border border-primary/20 [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]" />
              <div className="pointer-events-none absolute left-5 top-5 h-7 w-7 border-l-2 border-t-2 border-primary-glow/80" />
              <div className="pointer-events-none absolute right-5 top-5 h-7 w-7 border-r-2 border-t-2 border-primary-glow/50" />
              <div className="pointer-events-none absolute bottom-5 left-5 h-7 w-7 border-b-2 border-l-2 border-primary-glow/50" />
              <div className="pointer-events-none absolute bottom-5 right-5 h-7 w-7 border-b-2 border-r-2 border-primary-glow/80" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center">
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-primary-glow/90">
                  Hunter Mascot
                </p>
                <div className="relative mt-6 flex h-[188px] w-[188px] items-center justify-center">
                  <div className="absolute inset-0 rounded-[2rem] bg-primary-glow/25 blur-[42px]" />
                  <div className="absolute inset-[10px] border border-primary-glow/20 bg-[linear-gradient(180deg,oklch(0.14_0.035_286/0.96),oklch(0.09_0.025_272/1))] shadow-[inset_0_0_0_1px_oklch(0.84_0.08_300/0.05),0_0_24px_oklch(0.56_0.18_292/0.18)] [clip-path:polygon(26%_0,74%_0,100%_26%,100%_74%,74%_100%,26%_100%,0_74%,0_26%)]" />
                  <div className="absolute inset-[22px] bg-[radial-gradient(circle_at_50%_52%,oklch(0.48_0.18_292/0.18),transparent_42%),linear-gradient(180deg,oklch(0.13_0.035_286/0.98),oklch(0.09_0.025_272/1))] [clip-path:polygon(26%_0,74%_0,100%_26%,100%_74%,74%_100%,26%_100%,0_74%,0_26%)]" />
                  <Image
                    src={hunterFigure}
                    alt=""
                    width={148}
                    height={148}
                    sizes="148px"
                    className="relative z-10 h-[148px] w-[148px] object-contain contrast-[1.1] saturate-[1.08] brightness-[0.98] drop-shadow-[0_0_24px_oklch(0.8_0.18_300/0.32)] [image-rendering:auto]"
                    priority={false}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.45em] text-primary-glow/90">
              ▸ Hunter Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-black leading-[0.92] tracking-tight glow-text [text-shadow:0_0_14px_oklch(0.92_0.08_320/0.55),0_0_34px_oklch(0.84_0.12_300/0.22)] sm:text-5xl lg:text-6xl xl:text-[4.65rem]">
              Welcome back, {profile?.display_name ?? "Hunter"}
            </h1>
            <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/90">
                  Current Level
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-5xl font-black leading-none glow-text [text-shadow:0_0_12px_oklch(0.92_0.1_320/0.45)] sm:text-6xl lg:text-[4.25rem]">
                    Lv. {profile?.level}
                    {isMaxHunterLevel(profile?.level) ? " MAX" : ""}
                  </p>
                  <span
                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-primary/20 bg-background/20 px-4 text-sm font-black tracking-[0.28em] shadow-[inset_0_0_0_1px_oklch(0.8_0.06_300/0.08),0_0_18px_oklch(0.58_0.18_298/0.12)] ${hunterRankClass}`}
                  >
                    {hunterRank}
                  </span>
                </div>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/90">
                  XP
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                  {getLevelProgressText(profile?.xp, profile?.xp_to_next, profile?.level)}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <div className="h-3 rounded-[2px] border border-primary/30 bg-background/55 p-[1px] shadow-[inset_0_0_0_1px_oklch(0.75_0.1_295/0.06)]">
                <div
                  className="h-full rounded-[1px] bg-[linear-gradient(90deg,oklch(0.66_0.17_286),oklch(0.84_0.14_310))] shadow-[0_0_14px_oklch(0.8_0.18_300/0.35)]"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={TrendingUp} label="Class" value={hunterRank} valueClass={hunterRankClass} />
          <Stat
            icon={Trophy}
            label="World"
            value={stats.worldRank}
            to="/leaderboard"
            helperText="Open leaderboard"
          />
          <Stat icon={Sword} label="Completed" value={String(stats.completed)} />
          <Stat icon={Flame} label="Streak" value={`${profile?.streak_days ?? 0}d`} />
        </div>
      </div>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel frame-corner p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-wider">▸ ACTIVE QUESTS</h2>
            <Link to="/quests" className="text-xs text-primary-glow hover:underline">
              View all →
            </Link>
          </div>
          {active.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Sword className="w-10 h-10 mx-auto opacity-50 mb-3" />
              <p>No active quests. Accept one from the catalog.</p>
              <Link
                to="/quests"
                className="mt-4 inline-block btn-glow px-4 py-2 rounded-md text-sm"
              >
                Browse Quests
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((uq) => (
                <QuestRow key={uq.id} uq={uq} onChanged={refreshDashboard} />
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel frame-corner p-6">
          <h2 className="mb-4 text-xl font-bold tracking-wider">▸ RECENT XP</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No XP logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between border-b border-border pb-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{l.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="font-bold text-success">+{l.amount} XP</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/ai"
            className="mt-6 block rounded-md py-2 text-center text-sm font-semibold btn-glow"
          >
            <Sparkles className="mr-1 inline h-4 w-4" /> Ask AI Planner
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  valueClass,
  to,
  helperText,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  valueClass?: string;
  to?: string;
  helperText?: string;
}) {
  const content = (
    <div
      className={`glass-panel p-3 text-center ${to ? "cursor-pointer transition hover:border-primary/40 hover:bg-primary/5" : ""}`}
    >
      <Icon className="w-4 h-4 mx-auto text-primary-glow" />
      <p className={valueClass ? `text-lg font-bold mt-1 ${valueClass}` : "text-lg font-bold mt-1"}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      {helperText ? <p className="mt-1 text-[10px] text-primary-glow/80">{helperText}</p> : null}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
}

function QuestRow({ uq, onChanged }: { uq: DailyQuest; onChanged: () => void }) {
  const { user, session } = useAuth();
  const [busy, setBusy] = useState(false);

  const complete = async () => {
    if (!user || !session?.access_token) return;
    setBusy(true);
    let data: unknown = null;
    try {
      const resolvedQuest = await resolveActiveQuestAssignment(user.id, uq);
      data = await completeQuestWithFallback(user.id, resolvedQuest, session.access_token);
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "Failed to complete quest");
      return;
    }
    const unlocked = Array.isArray((data as { unlocked?: unknown } | null)?.unlocked)
      ? ((data as { unlocked: string[] }).unlocked ?? [])
      : [];
    if (unlocked.length > 0) {
      const pretty = unlocked.map((code) => code.replaceAll("_", " ")).join(", ");
      toast.success(`Unlocked: ${pretty}`);
    }
    setBusy(false);
    onChanged();
  };

  const pct = Math.min(100, (uq.progress / uq.quest.target_value) * 100);
  return (
    <div className="border border-border rounded-md p-3 hover:bg-secondary/30 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{uq.quest.title}</h3>
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-accent/30 text-primary-glow">
              {uq.quest.difficulty}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {uq.quest.category}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">{uq.quest.description}</p>
          <div className="xp-bar mt-2">
            <div style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-warning font-bold text-sm whitespace-nowrap">
            +{uq.quest.xp_reward} XP
          </span>
          <button
            onClick={complete}
            disabled={busy}
            className="btn-glow text-xs px-3 py-1 rounded font-semibold disabled:opacity-50"
          >
            {busy ? "…" : "Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
