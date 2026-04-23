import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Search, Sword } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Dumbbell, Flame, Timer, Target, X } from "lucide-react";

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

// Workout templates per quest title keyword (Solo-Leveling style training plans)
interface Exercise {
  name: string;
  muscle: string; // ABS | BICEPS | TRICEPS | BACK | CHEST | GLUTES | QUADS | CARDIO | MIND
  sets: string;
  reps: string;
  rest: string;
}
interface Workout {
  intro: string;
  duration: string;
  exercises: Exercise[];
}

const MUSCLE_COLORS: Record<string, string> = {
  ABS: "from-blue-500/30 to-blue-700/10",
  BICEPS: "from-blue-500/30 to-blue-700/10",
  TRICEPS: "from-blue-500/30 to-blue-700/10",
  BACK: "from-blue-500/30 to-blue-700/10",
  CHEST: "from-blue-500/30 to-blue-700/10",
  GLUTES: "from-blue-500/30 to-blue-700/10",
  QUADS: "from-blue-500/30 to-blue-700/10",
  CARDIO: "from-orange-500/30 to-red-700/10",
  MIND: "from-purple-500/30 to-indigo-700/10",
};

function buildWorkout(q: Quest): Workout {
  const t = q.title.toLowerCase();
  // Cardio / running
  if (t.includes("run") || t.includes("гүй")) {
    return {
      intro: "Endurance run protocol — pace yourself, breathe steady.",
      duration: `${q.target_value} ${q.unit ?? "km"}`,
      exercises: [
        { name: "Dynamic Warm-up", muscle: "CARDIO", sets: "1", reps: "5 min", rest: "—" },
        { name: `Run ${q.target_value} ${q.unit ?? "km"}`, muscle: "CARDIO", sets: "1", reps: "Steady pace", rest: "—" },
        { name: "Cool-down Walk", muscle: "CARDIO", sets: "1", reps: "5 min", rest: "—" },
        { name: "Hamstring Stretch", muscle: "QUADS", sets: "2", reps: "30 sec", rest: "15 sec" },
      ],
    };
  }
  // Strength
  if (t.includes("strength") || t.includes("хүч")) {
    return {
      intro: "Full-body strength circuit — forge raw power.",
      duration: "30 min",
      exercises: [
        { name: "Push-ups", muscle: "CHEST", sets: "4", reps: "12", rest: "60 sec" },
        { name: "Bicep Curls", muscle: "BICEPS", sets: "3", reps: "10", rest: "45 sec" },
        { name: "Tricep Dips", muscle: "TRICEPS", sets: "3", reps: "10", rest: "45 sec" },
        { name: "Bent-over Rows", muscle: "BACK", sets: "4", reps: "10", rest: "60 sec" },
        { name: "Goblet Squats", muscle: "QUADS", sets: "4", reps: "12", rest: "60 sec" },
      ],
    };
  }
  // Flexibility / stretch
  if (t.includes("flex") || t.includes("stretch") || t.includes("сунгалт")) {
    return {
      intro: "Mobility flow — loosen the body, sharpen the mind.",
      duration: `${q.target_value} ${q.unit ?? "min"}`,
      exercises: [
        { name: "Cat-Cow", muscle: "BACK", sets: "2", reps: "10 reps", rest: "—" },
        { name: "Hip Flexor Stretch", muscle: "QUADS", sets: "2", reps: "45 sec/side", rest: "—" },
        { name: "Shoulder Roll", muscle: "BACK", sets: "2", reps: "15 reps", rest: "—" },
        { name: "Forward Fold", muscle: "GLUTES", sets: "2", reps: "30 sec", rest: "—" },
      ],
    };
  }
  // Cold shower / discipline
  if (t.includes("cold") || t.includes("shower")) {
    return {
      intro: "Mental fortitude protocol — embrace the cold, dominate fear.",
      duration: `${q.target_value} ${q.unit ?? "min"}`,
      exercises: [
        { name: "Box Breathing", muscle: "MIND", sets: "1", reps: "1 min", rest: "—" },
        { name: `Cold Shower`, muscle: "MIND", sets: "1", reps: `${q.target_value} ${q.unit ?? "min"}`, rest: "—" },
        { name: "Recovery Breath", muscle: "MIND", sets: "1", reps: "2 min", rest: "—" },
      ],
    };
  }
  // Reading / focus / sleep / code
  if (q.category === "mind" || q.category === "study" || q.category === "work") {
    return {
      intro: "Cognitive training — sharpen focus, level up the mind.",
      duration: `${q.target_value} ${q.unit ?? ""}`,
      exercises: [
        { name: "Clear Workspace", muscle: "MIND", sets: "1", reps: "2 min", rest: "—" },
        { name: q.title, muscle: "MIND", sets: "1", reps: `${q.target_value} ${q.unit ?? ""}`, rest: "—" },
        { name: "Reflect / Note", muscle: "MIND", sets: "1", reps: "3 min", rest: "—" },
      ],
    };
  }
  // Default fitness
  return {
    intro: "Standard training protocol — execute with precision.",
    duration: `${q.target_value} ${q.unit ?? ""}`,
    exercises: [
      { name: "Warm-up", muscle: "CARDIO", sets: "1", reps: "3 min", rest: "—" },
      { name: q.title, muscle: "CHEST", sets: "3", reps: `${q.target_value} ${q.unit ?? "reps"}`, rest: "60 sec" },
      { name: "Cool-down Stretch", muscle: "BACK", sets: "1", reps: "3 min", rest: "—" },
    ],
  };
}

// Mini SVG body diagram with highlighted muscle group
function BodyDiagram({ muscle }: { muscle: string }) {
  const isBack = muscle === "BACK" || muscle === "GLUTES";
  const hl = (m: string) => muscle === m ? "fill-primary" : "fill-muted-foreground/30";
  return (
    <svg viewBox="0 0 80 120" className="w-20 h-28">
      {/* head */}
      <circle cx="40" cy="12" r="8" className="fill-muted-foreground/40" />
      {/* torso */}
      <path d="M25 22 L55 22 L58 60 L50 70 L30 70 L22 60 Z" className="fill-muted-foreground/25" />
      {/* arms */}
      <path d="M22 24 L14 55 L20 56 L26 28 Z" className={hl("BICEPS") + (isBack ? " " + hl("TRICEPS") : "")} />
      <path d="M58 24 L66 55 L60 56 L54 28 Z" className={hl("BICEPS") + (isBack ? " " + hl("TRICEPS") : "")} />
      {/* legs */}
      <path d="M30 70 L28 110 L36 110 L40 72 Z" className={hl("QUADS")} />
      <path d="M50 70 L52 110 L44 110 L40 72 Z" className={hl("QUADS")} />
      {/* highlighted regions */}
      {muscle === "CHEST" && <path d="M28 28 L52 28 L50 42 L30 42 Z" className="fill-primary" />}
      {muscle === "ABS" && <rect x="34" y="42" width="12" height="20" rx="2" className="fill-primary" />}
      {muscle === "BACK" && <path d="M30 26 L50 26 L48 50 L32 50 Z" className="fill-primary" />}
      {muscle === "GLUTES" && <rect x="30" y="62" width="20" height="10" rx="3" className="fill-primary" />}
    </svg>
  );
}

const PAGE_SIZE = 8;

function QuestsPage() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [openQuest, setOpenQuest] = useState<Quest | null>(null);

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
    setOpenQuest(null);
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
          <div
            key={q.id}
            onClick={() => setOpenQuest(q)}
            className="glass-panel frame-corner p-5 flex flex-col cursor-pointer hover:border-primary/60 hover:shadow-[0_0_20px_oklch(0.7_0.18_240/0.3)] transition"
          >
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
              onClick={(e) => { e.stopPropagation(); accept(q.id); }}
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
