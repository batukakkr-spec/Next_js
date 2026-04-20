import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, level, xp, streak_days")
        .order("level", { ascending: false })
        .order("xp", { ascending: false })
        .limit(50);
      setRows((data as Row[]) ?? []);
    })();
  }, []);

  return (
    <div className="space-y-6 animate-float-up">
      <div className="glass-panel frame-corner p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ Hall of Hunters</p>
        <h1 className="text-3xl font-bold glow-text mt-1">LEADERBOARD</h1>
      </div>

      <div className="glass-panel frame-corner overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3 w-16">Rank</th>
              <th className="text-left p-3">Hunter</th>
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
                    {RankIcon ? <RankIcon className={`w-5 h-5 ${i === 0 ? "text-warning" : i === 1 ? "text-primary-glow" : "text-muted-foreground"}`} /> : `#${i + 1}`}
                  </td>
                  <td className="p-3">
                    <p className="font-semibold">{r.display_name ?? r.username ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">@{r.username ?? "—"}</p>
                  </td>
                  <td className="p-3 text-right font-bold glow-text">{r.level}</td>
                  <td className="p-3 text-right hidden sm:table-cell">{r.xp}</td>
                  <td className="p-3 text-right hidden md:table-cell">🔥 {r.streak_days}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No Hunters yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
