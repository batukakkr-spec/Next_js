import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Sword, Flame, TrendingUp, Trophy, Sparkles } from "lucide-react";

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

function Dashboard() {
  const { profile, user, refreshProfile } = useAuth();
  const [active, setActive] = useState<DailyQuest[]>([]);
  const [recent, setRecent] = useState<XpLog[]>([]);
  const [stats, setStats] = useState({ completed: 0, totalXp: 0, rank: "—" });

  const load = async () => {
    if (!user) return;
    const [{ data: aq }, { data: logs }] = await Promise.all([
      supabase
        .from("user_quests")
        .select("id, status, progress, quest:quests(id, title, description, xp_reward, target_value, unit, category, difficulty)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("xp_logs")
        .select("id, amount, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    setActive((aq as unknown as DailyQuest[]) ?? []);
    setRecent((logs as XpLog[]) ?? []);

    const { count } = await supabase
      .from("user_quests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed");

    const { data: ranks } = await supabase
      .from("profiles")
      .select("user_id, level, xp")
      .order("level", { ascending: false })
      .order("xp", { ascending: false });
    const idx = ranks?.findIndex((r) => r.user_id === user.id) ?? -1;

    setStats({
      completed: count ?? 0,
      totalXp: (logs ?? []).reduce((s, l) => s + (l.amount ?? 0), 0),
      rank: idx >= 0 ? `#${idx + 1}` : "—",
    });
  };

  useEffect(() => { void load(); }, [user]);

  const xpPct = profile ? Math.min(100, (profile.xp / profile.xp_to_next) * 100) : 0;

  return (
    <div className="space-y-6 animate-float-up">
      {/* Header */}
      <div className="glass-panel frame-corner p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ Hunter Dashboard</p>
        <h1 className="text-3xl lg:text-4xl font-bold glow-text mt-1">
          Welcome back, {profile?.display_name ?? "Hunter"}
        </h1>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Current Level</p>
                <p className="text-5xl font-black glow-text">Lv. {profile?.level}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">XP</p>
                <p className="text-2xl font-bold">{profile?.xp} <span className="text-sm text-muted-foreground">/ {profile?.xp_to_next}</span></p>
              </div>
            </div>
            <div className="xp-bar mt-3"><div style={{ width: `${xpPct}%` }} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={Trophy} label="Rank" value={stats.rank} />
            <Stat icon={Sword} label="Completed" value={String(stats.completed)} />
            <Stat icon={Flame} label="Streak" value={`${profile?.streak_days ?? 0}d`} />
          </div>
        </div>
      </div>

      {/* Active quests */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel frame-corner p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-wider">▸ ACTIVE QUESTS</h2>
            <Link to="/quests" className="text-xs text-primary-glow hover:underline">View all →</Link>
          </div>
          {active.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Sword className="w-10 h-10 mx-auto opacity-50 mb-3" />
              <p>No active quests. Accept one from the catalog.</p>
              <Link to="/quests" className="mt-4 inline-block btn-glow px-4 py-2 rounded-md text-sm">
                Browse Quests
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((uq) => (
                <QuestRow key={uq.id} uq={uq} onChanged={async () => { await load(); await refreshProfile(); }} />
              ))}
            </div>
          )}
        </div>

        {/* Recent XP */}
        <div className="glass-panel frame-corner p-6">
          <h2 className="text-xl font-bold tracking-wider mb-4">▸ RECENT XP</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No XP logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((l) => (
                <li key={l.id} className="flex items-center justify-between text-sm border-b border-border pb-2">
                  <div>
                    <p className="font-medium">{l.reason}</p>
                    <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-success font-bold">+{l.amount} XP</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/ai" className="mt-6 block text-center btn-glow py-2 rounded-md text-sm font-semibold">
            <Sparkles className="inline w-4 h-4 mr-1" /> Ask AI Planner
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="glass-panel p-3 text-center">
      <Icon className="w-4 h-4 mx-auto text-primary-glow" />
      <p className="text-lg font-bold mt-1">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function QuestRow({ uq, onChanged }: { uq: DailyQuest; onChanged: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const complete = async () => {
    if (!user) return;
    setBusy(true);
    const { error: e1 } = await supabase
      .from("user_quests")
      .update({ status: "completed", progress: uq.quest.target_value, completed_at: new Date().toISOString() })
      .eq("id", uq.id);
    if (e1) { setBusy(false); return; }
    await supabase.rpc("award_xp", {
      _user_id: user.id,
      _amount: uq.quest.xp_reward,
      _reason: `Quest: ${uq.quest.title}`,
      _quest_id: uq.quest.id,
    });
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
          <div className="xp-bar mt-2"><div style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-warning font-bold text-sm whitespace-nowrap">+{uq.quest.xp_reward} XP</span>
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
