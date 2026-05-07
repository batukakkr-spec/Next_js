"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { buildLeaderboardEntries } from "@/lib/leaderboard";
import { toast } from "sonner";
import { format, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import {
  Shield,
  Users,
  RefreshCw,
  Activity,
  BarChart3,
  Crown,
  Target,
  Zap,
  Download,
  CalendarRange,
  TrendingUp,
  Orbit,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
});

interface Quest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  xp_reward: number;
  target_value: number;
  unit: string | null;
  is_active: boolean;
}

interface UserRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  level: number;
  xp: number;
  roles: ("admin" | "moderator" | "user")[];
}

interface UserQuestRow {
  id: string;
  user_id: string;
  quest_id: string;
  status: "active" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
}

interface XpLogRow {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

interface DailyAnalyticsPoint {
  date: string;
  xp: number;
  completed: number;
}

interface CategoryAnalyticsPoint {
  category: string;
  total: number;
  active: number;
  completed: number;
}

interface DifficultyAnalyticsPoint {
  difficulty: string;
  total: number;
}

interface TopHunter {
  user_id: string;
  name: string;
  level: number;
  xp: number;
  streak_days: number;
  completedQuests: number;
}

interface AdminAnalytics {
  rangeLabel: string;
  overview: {
    totalXpAwarded: number;
    completedQuests: number;
    activeAssignments: number;
    completionRate: number;
    averageLevel: number;
    averageStreak: number;
    participatingUsers: number;
    participationRate: number;
    averageXpPerUser: number;
    questUtilizationRate: number;
    failedQuests: number;
  };
  daily: DailyAnalyticsPoint[];
  categoryBreakdown: CategoryAnalyticsPoint[];
  difficultyBreakdown: DifficultyAnalyticsPoint[];
  roleDistribution: { name: string; value: number }[];
  topHunters: TopHunter[];
  highlights: {
    topPerformer: string;
    topCategory: string;
    highestStreak: string;
  };
}

interface AnalyticsSource {
  quests: Quest[];
  users: Array<Omit<UserRow, "roles"> & { streak_days: number }>;
  roles: { user_id: string; role: UserRow["roles"][number] }[];
  userQuests: UserQuestRow[];
  xpLogs: XpLogRow[];
}

type AnalyticsRange = "7d" | "30d" | "all";

const ADMIN_PIE_COLORS = [
  "oklch(0.8 0.2 304)",
  "oklch(0.72 0.18 264)",
  "oklch(0.64 0.16 226)",
  "oklch(0.58 0.12 192)",
];

function AdminPage() {
  const { hasRole, loading, user } = useAuth();
  const navigate = useNavigate();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [analyticsSource, setAnalyticsSource] = useState<AnalyticsSource | null>(null);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    if (!loading && !hasRole("admin")) {
      toast.error("Admin access required");
      navigate({ to: "/dashboard" });
    }
  }, [loading, hasRole, navigate]);

  const load = async () => {
    const [
      { data: q, error: questError },
      { data: u, error: userError },
      { data: roleRows, error: roleError },
      { data: userQuestRows, error: userQuestError },
      { data: xpLogRows, error: xpLogError },
    ] = await Promise.all([
      supabase.from("quests").select("*").order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("user_id, username, display_name, level, xp, streak_days")
        .order("level", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase
        .from("user_quests")
        .select("id, user_id, quest_id, status, created_at, completed_at")
        .order("created_at", { ascending: false }),
      supabase.from("xp_logs").select("id, user_id, amount, created_at").order("created_at", {
        ascending: false,
      }),
    ]);

    if (questError) {
      throw questError;
    }

    if (userError) {
      throw userError;
    }

    if (roleError) {
      throw roleError;
    }

    if (userQuestError) {
      throw userQuestError;
    }

    if (xpLogError) {
      throw xpLogError;
    }

    const rolesByUser = new Map<string, UserRow["roles"]>();
    for (const row of (roleRows ?? []) as { user_id: string; role: UserRow["roles"][number] }[]) {
      const existing = rolesByUser.get(row.user_id) ?? [];
      if (!existing.includes(row.role)) {
        existing.push(row.role);
      }
      rolesByUser.set(row.user_id, existing);
    }

    setQuests((q as Quest[]) ?? []);
    setAnalyticsSource({
      quests: (q as Quest[]) ?? [],
      users: ((u ?? []) as (Omit<UserRow, "roles"> & { streak_days: number })[]) ?? [],
      roles: ((roleRows ?? []) as { user_id: string; role: UserRow["roles"][number] }[]) ?? [],
      userQuests: (userQuestRows as UserQuestRow[]) ?? [],
      xpLogs: (xpLogRows as XpLogRow[]) ?? [],
    });
  };

  useEffect(() => {
    if (!hasRole("admin")) return;

    void load().catch((error) => {
      toast.error(error instanceof Error ? error.message : "Failed to load admin data");
    });
  }, [hasRole]);

  const reloadAdminData = async () => {
    setReloading(true);
    try {
      await load();
      toast.success("Admin data refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reload admin data");
    } finally {
      setReloading(false);
    }
  };

  if (!hasRole("admin")) return null;

  return (
    <div className="space-y-6 animate-float-up">
      <div className="glass-panel frame-corner p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ Restricted Zone</p>
        <h1 className="text-3xl font-bold glow-text mt-1 flex items-center gap-2">
          <Shield className="text-primary-glow" /> ADMIN CONSOLE
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Эндээс quest үүсгэх, идэвхгүй болгох, мөн хэрэглэгчдэд moderator/admin эрх олгох
          удирдлагын бүх хэсэг харагдана.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-md border border-primary/20 bg-secondary/30 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Quests:</span>{" "}
            <span className="font-semibold text-primary-glow">{quests.length}</span>
          </div>
          <div className="rounded-md border border-primary/20 bg-secondary/30 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Users:</span>{" "}
            <span className="font-semibold text-primary-glow">
              {analyticsSource?.users.length ?? 0}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void reloadAdminData()}
            disabled={reloading}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary/40 hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {analyticsSource ? <AdminAnalyticsSection source={analyticsSource} /> : null}
    </div>
  );
}

function buildAdminAnalytics(source: AnalyticsSource, range: AnalyticsRange): AdminAnalytics {
  const { quests, users, roles, userQuests, xpLogs } = source;
  const now = new Date();
  const filterStart =
    range === "7d"
      ? startOfDay(subDays(now, 6))
      : range === "30d"
        ? startOfDay(subDays(now, 29))
        : null;
  const rangeLabel = range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "All time";
  const filteredXpLogs = filterStart
    ? xpLogs.filter((log) => new Date(log.created_at) >= filterStart)
    : xpLogs;
  const filteredUserQuests = filterStart
    ? userQuests.filter((assignment) => {
        const createdAt = new Date(assignment.created_at);
        const completedAt = assignment.completed_at ? new Date(assignment.completed_at) : null;
        return createdAt >= filterStart || (completedAt ? completedAt >= filterStart : false);
      })
    : userQuests;
  const buckets =
    range === "all"
      ? Array.from({ length: 6 }, (_, index) => {
          const date = startOfMonth(subMonths(now, 5 - index));
          return {
            key: format(date, "yyyy-MM"),
            date: format(date, "MMM yyyy"),
            xp: 0,
            completed: 0,
          };
        })
      : Array.from({ length: range === "7d" ? 7 : 30 }, (_, index) => {
          const offset = range === "7d" ? 6 - index : 29 - index;
          const date = subDays(now, offset);
          return {
            key: format(date, "yyyy-MM-dd"),
            date: format(date, range === "7d" ? "MMM d" : "d MMM"),
            xp: 0,
            completed: 0,
          };
        });
  const dailyMap = new Map(buckets.map((item) => [item.key, item]));

  for (const log of filteredXpLogs) {
    const key = format(new Date(log.created_at), range === "all" ? "yyyy-MM" : "yyyy-MM-dd");
    const bucket = dailyMap.get(key);
    if (bucket) bucket.xp += log.amount ?? 0;
  }

  for (const assignment of filteredUserQuests) {
    if (!assignment.completed_at || assignment.status !== "completed") continue;
    const key = format(
      new Date(assignment.completed_at),
      range === "all" ? "yyyy-MM" : "yyyy-MM-dd",
    );
    const bucket = dailyMap.get(key);
    if (bucket) bucket.completed += 1;
  }

  const questById = new Map(quests.map((quest) => [quest.id, quest]));
  const categoryMap = new Map<string, CategoryAnalyticsPoint>();
  const difficultyMap = new Map<string, DifficultyAnalyticsPoint>();

  for (const quest of quests) {
    if (!categoryMap.has(quest.category)) {
      categoryMap.set(quest.category, {
        category: quest.category,
        total: 0,
        active: 0,
        completed: 0,
      });
    }
    if (!difficultyMap.has(quest.difficulty)) {
      difficultyMap.set(quest.difficulty, {
        difficulty: quest.difficulty,
        total: 0,
      });
    }

    const categoryEntry = categoryMap.get(quest.category);
    const difficultyEntry = difficultyMap.get(quest.difficulty);
    if (categoryEntry) {
      categoryEntry.total += 1;
      if (quest.is_active) {
        categoryEntry.active += 1;
      }
    }
    if (difficultyEntry) {
      difficultyEntry.total += 1;
    }
  }

  const completedPerUser = new Map<string, number>();
  const participatingUsers = new Set<string>();
  for (const assignment of filteredUserQuests) {
    participatingUsers.add(assignment.user_id);
    if (assignment.status === "completed") {
      completedPerUser.set(assignment.user_id, (completedPerUser.get(assignment.user_id) ?? 0) + 1);
      const quest = questById.get(assignment.quest_id);
      const categoryEntry = quest ? categoryMap.get(quest.category) : null;
      if (categoryEntry) {
        categoryEntry.completed += 1;
      }
    }
  }

  const roleCounts = new Map<string, number>();
  for (const role of roles) {
    roleCounts.set(role.role, (roleCounts.get(role.role) ?? 0) + 1);
  }

  const totalXpAwarded = filteredXpLogs.reduce((sum, log) => sum + (log.amount ?? 0), 0);
  const completedQuests = filteredUserQuests.filter(
    (assignment) => assignment.status === "completed",
  ).length;
  const activeAssignments = filteredUserQuests.filter(
    (assignment) => assignment.status === "active",
  ).length;
  const failedQuests = filteredUserQuests.filter(
    (assignment) => assignment.status === "failed",
  ).length;
  const completionRate =
    filteredUserQuests.length > 0 ? (completedQuests / filteredUserQuests.length) * 100 : 0;
  const averageLevel =
    users.length > 0 ? users.reduce((sum, current) => sum + current.level, 0) / users.length : 0;
  const averageStreak =
    users.length > 0
      ? users.reduce((sum, current) => sum + (current.streak_days ?? 0), 0) / users.length
      : 0;
  const participationRate = users.length > 0 ? (participatingUsers.size / users.length) * 100 : 0;
  const averageXpPerUser =
    participatingUsers.size > 0 ? totalXpAwarded / participatingUsers.size : 0;
  const questUtilizationRate = quests.length > 0 ? (activeAssignments / quests.length) * 100 : 0;

  const topHunters = buildLeaderboardEntries(users, 5).map((current) => ({
    user_id: current.user_id,
    name: current.displayName,
    level: current.level,
    xp: current.xp,
    streak_days: current.streakDays,
    completedQuests: completedPerUser.get(current.user_id) ?? 0,
  }));

  const highestStreakUser = [...users].sort(
    (left, right) => (right.streak_days ?? 0) - (left.streak_days ?? 0),
  )[0];

  const topCategory = [...categoryMap.values()].sort(
    (left, right) => right.completed - left.completed || right.active - left.active,
  )[0];

  return {
    rangeLabel,
    overview: {
      totalXpAwarded,
      completedQuests,
      activeAssignments,
      completionRate,
      averageLevel,
      averageStreak,
      participatingUsers: participatingUsers.size,
      participationRate,
      averageXpPerUser,
      questUtilizationRate,
      failedQuests,
    },
    daily: buckets.map(({ key: _key, ...point }) => point),
    categoryBreakdown: [...categoryMap.values()].sort(
      (left, right) => right.completed - left.completed,
    ),
    difficultyBreakdown: [...difficultyMap.values()].sort(
      (left, right) => right.total - left.total,
    ),
    roleDistribution: [
      { name: "admin", value: roleCounts.get("admin") ?? 0 },
      { name: "moderator", value: roleCounts.get("moderator") ?? 0 },
      { name: "user", value: users.length },
    ],
    topHunters,
    highlights: {
      topPerformer: topHunters[0]?.name ?? "No hunter yet",
      topCategory: topCategory ? toTitleCase(topCategory.category) : "No quest data",
      highestStreak: highestStreakUser
        ? `${highestStreakUser.display_name ?? highestStreakUser.username ?? "Unknown"} • ${
            highestStreakUser.streak_days ?? 0
          }d`
        : "No streak data",
    },
  };
}

function AdminAnalyticsSection({ source }: { source: AnalyticsSource }) {
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const analytics = buildAdminAnalytics(source, range);

  const exportAnalyticsReport = () => {
    const lines = [
      ["Range", analytics.rangeLabel],
      ["Total XP Awarded", String(analytics.overview.totalXpAwarded)],
      ["Completed Quests", String(analytics.overview.completedQuests)],
      ["Active Assignments", String(analytics.overview.activeAssignments)],
      ["Failed Quests", String(analytics.overview.failedQuests)],
      ["Completion Rate", `${analytics.overview.completionRate.toFixed(1)}%`],
      ["Participation Rate", `${analytics.overview.participationRate.toFixed(1)}%`],
      ["Average XP Per User", analytics.overview.averageXpPerUser.toFixed(1)],
      ["Average Hunter Level", analytics.overview.averageLevel.toFixed(1)],
      ["Average Streak", analytics.overview.averageStreak.toFixed(1)],
      [],
      ["Daily Activity"],
      ["Period", "XP", "Completed"],
      ...analytics.daily.map((point) => [point.date, String(point.xp), String(point.completed)]),
      [],
      ["Top Hunters"],
      ["Name", "Level", "XP", "Completed", "Streak"],
      ...analytics.topHunters.map((hunter) => [
        hunter.name,
        String(hunter.level),
        String(hunter.xp),
        String(hunter.completedQuests),
        `${hunter.streak_days}d`,
      ]),
    ];
    const csv = lines
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-analytics-${range}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Analytics report exported");
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary-glow" />
          <div>
            <h2 className="text-xl font-bold tracking-wider">Admin Analytics</h2>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              {analytics.rangeLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["7d", "30d", "all"] as AnalyticsRange[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                range === option
                  ? "border-primary/45 bg-primary/12 text-primary-glow shadow-[0_0_16px_oklch(0.78_0.18_300/0.16)]"
                  : "border-border bg-secondary/20 text-muted-foreground hover:border-primary/25 hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <CalendarRange className="h-3.5 w-3.5" />
                {option === "7d" ? "7 Days" : option === "30d" ? "30 Days" : "All Time"}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={exportAnalyticsReport}
            className="inline-flex items-center gap-2 rounded-md border border-primary/35 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary-glow transition hover:bg-primary/15"
          >
            <Download className="h-3.5 w-3.5" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          icon={Zap}
          label="Total XP Awarded"
          value={analytics.overview.totalXpAwarded.toLocaleString()}
          hint="All-time XP sent through quest completions"
          delayMs={0}
        />
        <AnalyticsCard
          icon={Target}
          label="Quest Completion Rate"
          value={`${Math.round(analytics.overview.completionRate)}%`}
          hint={`${analytics.overview.completedQuests} completed / ${analytics.overview.activeAssignments} active now`}
          delayMs={80}
        />
        <AnalyticsCard
          icon={Crown}
          label="Average Hunter Level"
          value={analytics.overview.averageLevel.toFixed(1)}
          hint={`Average streak ${analytics.overview.averageStreak.toFixed(1)} days`}
          delayMs={160}
        />
        <AnalyticsCard
          icon={Activity}
          label="Live Assignments"
          value={analytics.overview.activeAssignments.toLocaleString()}
          hint="Currently active user quest entries"
          delayMs={240}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          icon={Users}
          label="Participation Rate"
          value={`${Math.round(analytics.overview.participationRate)}%`}
          hint={`${analytics.overview.participatingUsers} hunters touched quests in this range`}
          delayMs={0}
        />
        <AnalyticsCard
          icon={TrendingUp}
          label="Average XP Per User"
          value={analytics.overview.averageXpPerUser.toFixed(0)}
          hint="XP efficiency across active hunters"
          delayMs={80}
        />
        <AnalyticsCard
          icon={Orbit}
          label="Quest Utilization"
          value={`${Math.round(analytics.overview.questUtilizationRate)}%`}
          hint="How heavily the quest pool is being used"
          delayMs={160}
        />
        <AnalyticsCard
          icon={Shield}
          label="Failed Quests"
          value={analytics.overview.failedQuests.toLocaleString()}
          hint="Assignments that ended without completion"
          delayMs={240}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div
          className="glass-panel frame-corner animate-float-up p-5"
          style={{ animationDelay: "60ms" }}
        >
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.32em] text-primary-glow">
              Activity Timeline
            </p>
            <h3 className="mt-1 text-lg font-bold">XP and completions trend</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.daily}>
                <defs>
                  <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.8 0.2 304)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="oklch(0.8 0.2 304)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="completeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.68 0.16 230)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.68 0.16 230)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.42 0.06 286 / 0.35)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="oklch(0.74 0.05 292)"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="oklch(0.74 0.05 292)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.12 0.04 286 / 0.96)",
                    border: "1px solid oklch(0.66 0.18 300 / 0.32)",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="oklch(0.8 0.2 304)"
                  fill="url(#xpFill)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="oklch(0.68 0.16 230)"
                  fill="url(#completeFill)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="glass-panel frame-corner animate-float-up p-5"
          style={{ animationDelay: "120ms" }}
        >
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.32em] text-primary-glow">
              Roles Overview
            </p>
            <h3 className="mt-1 text-lg font-bold">Access distribution</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.roleDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={4}
                >
                  {analytics.roleDistribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={ADMIN_PIE_COLORS[index % ADMIN_PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.12 0.04 286 / 0.96)",
                    border: "1px solid oklch(0.66 0.18 300 / 0.32)",
                    borderRadius: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {analytics.roleDistribution.map((entry) => (
              <div
                key={entry.name}
                className="rounded-md border border-border bg-secondary/20 px-2 py-2"
              >
                <p className="text-primary-glow">{entry.value}</p>
                <p>{entry.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <div
          className="glass-panel frame-corner animate-float-up p-5"
          style={{ animationDelay: "180ms" }}
        >
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.32em] text-primary-glow">
              Category Breakdown
            </p>
            <h3 className="mt-1 text-lg font-bold">Which quest types perform best</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.categoryBreakdown}>
                <CartesianGrid stroke="oklch(0.42 0.06 286 / 0.35)" vertical={false} />
                <XAxis
                  dataKey="category"
                  stroke="oklch(0.74 0.05 292)"
                  tickFormatter={toTitleCase}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="oklch(0.74 0.05 292)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.12 0.04 286 / 0.96)",
                    border: "1px solid oklch(0.66 0.18 300 / 0.32)",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="completed" fill="oklch(0.8 0.2 304)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="active" fill="oklch(0.68 0.16 230)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="glass-panel frame-corner animate-float-up p-5"
          style={{ animationDelay: "240ms" }}
        >
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.32em] text-primary-glow">Top Hunters</p>
            <h3 className="mt-1 text-lg font-bold">Leaderboard snapshot</h3>
          </div>
          <div className="space-y-3">
            {analytics.topHunters.length > 0 ? (
              analytics.topHunters.map((hunter, index) => (
                <div
                  key={hunter.user_id}
                  className="rounded-xl border border-primary/15 bg-secondary/20 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{hunter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Lv. {hunter.level} • {hunter.completedQuests} completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-glow">#{index + 1}</p>
                      <p className="text-xs text-muted-foreground">{hunter.streak_days}d streak</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/70">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.62_0.18_286),oklch(0.84_0.14_310))]"
                      style={{
                        width: `${Math.max(
                          12,
                          analytics.topHunters[0]?.xp
                            ? (hunter.xp / analytics.topHunters[0].xp) * 100
                            : 0,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-secondary/10 px-4 py-8 text-center text-sm text-muted-foreground">
                Leaderboard data alga байна.
              </div>
            )}
          </div>
        </div>

        <div
          className="glass-panel frame-corner animate-float-up p-5"
          style={{ animationDelay: "300ms" }}
        >
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.32em] text-primary-glow">
              Quick Insights
            </p>
            <h3 className="mt-1 text-lg font-bold">Admin pulse</h3>
          </div>
          <div className="space-y-3">
            <InsightRow label="Top performer" value={analytics.highlights.topPerformer} />
            <InsightRow label="Best category" value={analytics.highlights.topCategory} />
            <InsightRow label="Highest streak" value={analytics.highlights.highestStreak} />
            <InsightRow
              label="Difficulty spread"
              value={analytics.difficultyBreakdown
                .map((entry) => `${toTitleCase(entry.difficulty)} ${entry.total}`)
                .join(" • ")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalyticsCard({
  icon: Icon,
  label,
  value,
  hint,
  delayMs,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint: string;
  delayMs?: number;
}) {
  return (
    <div
      className="glass-panel frame-corner animate-float-up p-4"
      style={{ animationDelay: `${delayMs ?? 0}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black text-primary-glow">{value}</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary-glow" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-secondary/20 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-primary-glow">{value}</p>
    </div>
  );
}

function toTitleCase(value: string) {
  return value.replace(/(^|\s|-)\S/g, (match) => match.toUpperCase());
}
