"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildLeaderboardEntries, type LeaderboardEntry } from "@/lib/leaderboard";
import { Trophy, Crown, Medal } from "lucide-react";

export const Route = createFileRoute("/_app/leaderboard")({
  component: Leaderboard,
});

interface Row {
  user_id: string;
  username: string | null;
  display_name: string | null;
  level: number;
  xp: number;
  streak_days: number;
}

async function fetchLeaderboard() {
  const { data } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, level, xp, streak_days")
    .order("level", { ascending: false })
    .order("xp", { ascending: false })
    .limit(50);

  return buildLeaderboardEntries(((data as Row[]) ?? []).slice(0, 50));
}

function Leaderboard() {
  const { data: rows = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 2 * 60_000,
  });

  return (
    <div className="space-y-6 animate-float-up">
      <div className="glass-panel frame-corner p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ Hall of Hunters</p>
        <h1 className="text-3xl font-bold glow-text mt-1">LEADERBOARD</h1>
      </div>

      <div className="glass-panel frame-corner overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3 w-16">Place</th>
              <th className="text-left p-3">Hunter</th>
              <th className="text-center p-3 hidden sm:table-cell">Class</th>
              <th className="text-right p-3">Level</th>
              <th className="text-right p-3 hidden sm:table-cell">XP</th>
              <th className="text-right p-3 hidden md:table-cell">Streak</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const RankIcon = i === 0 ? Crown : i === 1 ? Trophy : i === 2 ? Medal : null;
              return (
                <tr key={r.user_id} className="border-t border-border hover:bg-secondary/20">
                  <td className="p-3 font-bold">
                    {RankIcon ? (
                      <RankIcon
                        className={`w-5 h-5 ${i === 0 ? "text-warning" : i === 1 ? "text-primary-glow" : "text-muted-foreground"}`}
                      />
                    ) : (
                      `#${i + 1}`
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{r.displayName}</p>
                      <span
                        className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[10px] font-black tracking-[0.2em] sm:hidden ${r.rankClass}`}
                      >
                        {r.rank}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">@{r.username ?? "—"}</p>
                  </td>
                  <td className="p-3 text-center hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-black tracking-[0.25em] ${r.rankClass}`}
                    >
                      {r.rank}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold glow-text">{r.level}</td>
                  <td className="p-3 text-right hidden sm:table-cell">{r.xp}</td>
                  <td className="p-3 text-right hidden md:table-cell">🔥 {r.streakDays}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted-foreground">
                  No Hunters yet.
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
