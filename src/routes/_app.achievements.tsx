import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Sparkles, Flame, Crown, Trophy, Medal } from "lucide-react";

export const Route = createFileRoute("/_app/achievements")({
  component: AchievementsPage,
});

interface Ach {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
}

const iconMap: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  flame: Flame,
  crown: Crown,
  trophy: Trophy,
};

function AchievementsPage() {
  const { user } = useAuth();
  const [all, setAll] = useState<Ach[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());

  useEffect(() => {
    void (async () => {
      const [{ data: a }, { data: ua }] = await Promise.all([
        supabase.from("achievements").select("*"),
        user ? supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      ]);
      setAll((a as Ach[]) ?? []);
      setEarned(new Set(((ua ?? []) as { achievement_id: string }[]).map((x) => x.achievement_id)));
    })();
  }, [user]);

  return (
    <div className="space-y-6 animate-float-up">
      <div className="glass-panel frame-corner p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ Records</p>
        <h1 className="text-3xl font-bold glow-text mt-1">ACHIEVEMENTS</h1>
        <p className="text-sm text-muted-foreground mt-2">{earned.size} / {all.length} unlocked</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {all.map((a) => {
          const Icon = iconMap[a.icon ?? ""] ?? Medal;
          const isEarned = earned.has(a.id);
          return (
            <div
              key={a.id}
              className={`glass-panel frame-corner p-5 transition ${isEarned ? "animate-pulse-glow" : "opacity-50 grayscale"}`}
            >
              <Icon className={`w-10 h-10 ${isEarned ? "text-primary-glow" : "text-muted-foreground"}`} />
              <h3 className="font-bold mt-3">{a.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
              <p className="text-xs text-warning mt-2 font-semibold">+{a.xp_reward} XP</p>
              {!isEarned && <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Locked</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
