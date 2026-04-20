import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Search, Sword } from "lucide-react";

export const Route = createFileRoute("/_app/quests")({
  component: QuestsPage,
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
}

const PAGE_SIZE = 8;

function QuestsPage() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);

  const load = async () => {
    const { data: q } = await supabase.from("quests").select("*").eq("is_active", true).order("xp_reward");
    setQuests((q as Quest[]) ?? []);
    if (user) {
      const { data: uq } = await supabase
        .from("user_quests").select("quest_id").eq("user_id", user.id).eq("status", "active");
      setAccepted(new Set((uq ?? []).map((x) => x.quest_id)));
    }
  };
  useEffect(() => { void load(); }, [user]);

  const accept = async (qid: string) => {
    if (!user) return;
    const { error } = await supabase.from("user_quests").insert({ user_id: user.id, quest_id: qid });
    if (error) { toast.error(error.message); return; }
    toast.success("⚔ Quest accepted");
    setAccepted((s) => new Set(s).add(qid));
  };

  const filtered = quests.filter((q) => {
    if (category !== "all" && q.category !== category) return false;
    if (filter && !q.title.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cats = ["all", "fitness", "mind", "study", "work", "social", "creative"];

  return (
    <div className="space-y-6 animate-float-up">
      <div className="glass-panel frame-corner p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ Quest Catalog</p>
        <h1 className="text-3xl font-bold glow-text mt-1">CHOOSE YOUR PATH</h1>
        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              placeholder="Search quests..."
              className="w-full bg-input/60 border border-border rounded-md pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); setPage(1); }}
                className={`px-3 py-1 rounded text-xs uppercase tracking-wider border transition ${
                  category === c ? "bg-accent/30 border-primary/50 text-primary-glow" : "border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {paged.map((q) => (
          <div key={q.id} className="glass-panel frame-corner p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold">{q.title}</h3>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-accent/30 text-primary-glow">{q.difficulty}</span>
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{q.category} · {q.target_value} {q.unit}</p>
              </div>
              <span className="text-warning font-bold whitespace-nowrap">+{q.xp_reward} XP</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3 flex-1">{q.description}</p>
            <button
              onClick={() => accept(q.id)}
              disabled={accepted.has(q.id)}
              className="mt-4 btn-glow py-2 rounded font-semibold text-sm disabled:opacity-40"
            >
              <Sword className="inline w-4 h-4 mr-1" />
              {accepted.has(q.id) ? "Already accepted" : "Accept Quest"}
            </button>
          </div>
        ))}
        {paged.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-10">No quests match your search.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded text-sm border ${page === i + 1 ? "bg-accent/40 border-primary/50 text-primary-glow" : "border-border"}`}
            >{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
