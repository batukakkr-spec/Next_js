"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Search, Sword } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface DashboardActiveQuest {
  id: string;
  status: string;
  progress: number;
  quest: Quest;
}

interface DashboardUserData {
  active: DashboardActiveQuest[];
  recent: unknown[];
  stats: {
    completed: number;
    totalXp: number;
    worldRank: string;
  };
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
  ABS: "from-cyan-500/25 via-cyan-400/10 to-transparent",
  BICEPS: "from-sky-500/25 via-sky-400/10 to-transparent",
  TRICEPS: "from-indigo-500/25 via-indigo-400/10 to-transparent",
  BACK: "from-violet-500/25 via-violet-400/10 to-transparent",
  CHEST: "from-blue-500/30 via-blue-400/10 to-transparent",
  GLUTES: "from-fuchsia-500/25 via-fuchsia-400/10 to-transparent",
  QUADS: "from-emerald-500/25 via-emerald-400/10 to-transparent",
  CARDIO: "from-orange-500/30 via-red-500/15 to-transparent",
  MIND: "from-purple-500/30 via-indigo-500/15 to-transparent",
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
        {
          name: `Run ${q.target_value} ${q.unit ?? "km"}`,
          muscle: "CARDIO",
          sets: "1",
          reps: "Steady pace",
          rest: "—",
        },
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
        {
          name: `Cold Shower`,
          muscle: "MIND",
          sets: "1",
          reps: `${q.target_value} ${q.unit ?? "min"}`,
          rest: "—",
        },
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
        {
          name: q.title,
          muscle: "MIND",
          sets: "1",
          reps: `${q.target_value} ${q.unit ?? ""}`,
          rest: "—",
        },
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
      {
        name: q.title,
        muscle: "CHEST",
        sets: "3",
        reps: `${q.target_value} ${q.unit ?? "reps"}`,
        rest: "60 sec",
      },
      { name: "Cool-down Stretch", muscle: "BACK", sets: "1", reps: "3 min", rest: "—" },
    ],
  };
}

// Mini SVG body diagram with highlighted muscle group
function BodyDiagram({ muscle }: { muscle: string }) {
  const isBack = muscle === "BACK" || muscle === "GLUTES";
  const ON = "fill-primary drop-shadow-[0_0_4px_oklch(0.7_0.18_240)]";
  const OFF = "fill-muted-foreground/15";
  const STROKE = "stroke-primary/40";
  const hl = (m: string) => (muscle === m ? ON : OFF);
  // For back view, BACK highlights upper torso, GLUTES highlights hips
  return (
    <svg viewBox="0 0 80 120" className="w-20 h-28 shrink-0">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.75 0.2 240)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="oklch(0.75 0.2 240)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* aura */}
      <ellipse cx="40" cy="60" rx="38" ry="58" fill="url(#glow)" opacity="0.25" />

      {/* head */}
      <circle cx="40" cy="11" r="7" className="fill-muted-foreground/40" />
      <path d="M34 18 L46 18 L45 22 L35 22 Z" className="fill-muted-foreground/30" />

      {/* neck/traps */}
      <path
        d="M36 22 L44 22 L48 28 L32 28 Z"
        className={isBack ? hl("BACK") : "fill-muted-foreground/25"}
      />

      {/* torso silhouette */}
      <path
        d="M28 26 L52 26 L56 42 L54 60 L48 70 L32 70 L26 60 L24 42 Z"
        className="fill-muted-foreground/15"
      />

      {/* shoulders/deltoids */}
      <ellipse cx="24" cy="30" rx="6" ry="5" className={hl("BICEPS")} />
      <ellipse cx="56" cy="30" rx="6" ry="5" className={hl("BICEPS")} />

      {/* upper arms (biceps front / triceps back) */}
      <path d="M18 32 L14 52 L20 54 L24 34 Z" className={hl(isBack ? "TRICEPS" : "BICEPS")} />
      <path d="M62 32 L66 52 L60 54 L56 34 Z" className={hl(isBack ? "TRICEPS" : "BICEPS")} />

      {/* forearms */}
      <path d="M14 52 L12 68 L18 68 L20 54 Z" className="fill-muted-foreground/20" />
      <path d="M66 52 L68 68 L62 68 L60 54 Z" className="fill-muted-foreground/20" />

      {/* CHEST (front only) */}
      {!isBack && (
        <>
          <path d="M30 30 L40 32 L40 44 L30 44 Z" className={hl("CHEST")} />
          <path d="M50 30 L40 32 L40 44 L50 44 Z" className={hl("CHEST")} />
        </>
      )}

      {/* BACK (back only - lats) */}
      {isBack && (
        <>
          <path d="M28 28 L40 30 L40 56 L30 58 L26 44 Z" className={hl("BACK")} />
          <path d="M52 28 L40 30 L40 56 L50 58 L54 44 Z" className={hl("BACK")} />
        </>
      )}

      {/* ABS (front 6-pack) */}
      {!isBack && (
        <g className={hl("ABS")}>
          <rect x="34" y="44" width="5" height="6" rx="1" />
          <rect x="41" y="44" width="5" height="6" rx="1" />
          <rect x="34" y="51" width="5" height="6" rx="1" />
          <rect x="41" y="51" width="5" height="6" rx="1" />
          <rect x="34" y="58" width="5" height="7" rx="1" />
          <rect x="41" y="58" width="5" height="7" rx="1" />
        </g>
      )}

      {/* GLUTES (back only) */}
      {isBack && (
        <>
          <ellipse cx="35" cy="68" rx="6" ry="5" className={hl("GLUTES")} />
          <ellipse cx="45" cy="68" rx="6" ry="5" className={hl("GLUTES")} />
        </>
      )}

      {/* QUADS / hamstrings (legs) */}
      <path d="M30 70 L28 92 L36 92 L39 72 Z" className={hl("QUADS")} />
      <path d="M50 70 L52 92 L44 92 L41 72 Z" className={hl("QUADS")} />

      {/* calves */}
      <path d="M28 92 L29 112 L35 112 L36 92 Z" className="fill-muted-foreground/20" />
      <path d="M52 92 L51 112 L45 112 L44 92 Z" className="fill-muted-foreground/20" />

      {/* outline stroke */}
      <path
        d="M28 26 L52 26 L56 42 L54 60 L48 70 L32 70 L26 60 L24 42 Z"
        className={STROKE}
        fill="none"
        strokeWidth="0.5"
      />

      {/* CARDIO icon overlay - heart pulse */}
      {muscle === "CARDIO" && (
        <g
          className="fill-orange-400 stroke-orange-400"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        >
          <path d="M30 50 L34 50 L36 44 L40 56 L44 48 L46 50 L50 50" />
        </g>
      )}

      {/* MIND overlay - brain glow on head */}
      {muscle === "MIND" && (
        <circle
          cx="40"
          cy="11"
          r="9"
          className="fill-purple-400/60 drop-shadow-[0_0_6px_oklch(0.7_0.2_300)]"
        />
      )}
    </svg>
  );
}

const PAGE_SIZE = 8;
const EMPTY_QUESTS: Quest[] = [];
const EMPTY_ACCEPTED = new Set<string>();

async function fetchQuestCatalog(userId?: string) {
  const { data: q } = await supabase
    .from("quests")
    .select("*")
    .eq("is_active", true)
    .order("xp_reward");

  const quests = (q as Quest[]) ?? [];

  if (!userId) {
    return {
      quests,
      accepted: new Set<string>(),
    };
  }

  const { data: uq } = await supabase
    .from("user_quests")
    .select("quest_id")
    .eq("user_id", userId)
    .eq("status", "active");

  return {
    quests,
    accepted: new Set((uq ?? []).map((x) => x.quest_id)),
  };
}

function isMissingQuestRpc(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  return (
    normalized.includes("could not find the function") ||
    normalized.includes("schema cache") ||
    normalized.includes("accept_quest")
  );
}

async function acceptQuestForUser(userId: string, questId: string) {
  const rpcResult = await supabase.rpc("accept_quest", { _quest_id: questId });
  if (!rpcResult.error) return;

  if (!isMissingQuestRpc(rpcResult.error.message)) {
    throw rpcResult.error;
  }

  const { error: insertError } = await supabase
    .from("user_quests")
    .insert({ user_id: userId, quest_id: questId });

  if (insertError) {
    throw insertError;
  }
}

function QuestsPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [openQuest, setOpenQuest] = useState<Quest | null>(null);
  const isAdmin = hasRole("admin");

  useEffect(() => {
    if (!isAdmin) return;
    toast.error("Admin account-ууд quest ашиглахгүй. Admin Console руу шилжлээ.");
    navigate({ to: "/admin" });
  }, [isAdmin, navigate]);

  const questsQuery = useQuery({
    queryKey: ["quests-catalog", user?.id ?? null],
    queryFn: () => fetchQuestCatalog(user?.id),
    enabled: !isAdmin,
    staleTime: 2 * 60_000,
  });
  const quests = questsQuery.data?.quests ?? EMPTY_QUESTS;
  const accepted = questsQuery.data?.accepted ?? EMPTY_ACCEPTED;

  const accept = async (qid: string) => {
    if (!user) return;
    const selectedQuest = quests.find((quest) => quest.id === qid);
    try {
      await acceptQuestForUser(user.id, qid);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept quest");
      return;
    }
    toast.success("⚔ Quest accepted");
    queryClient.setQueryData<{ quests: Quest[]; accepted: Set<string> }>(
      ["quests-catalog", user.id],
      (current) => ({
        quests: current?.quests ?? quests,
        accepted: new Set([...(current?.accepted ?? accepted), qid]),
      }),
    );
    if (selectedQuest) {
      queryClient.setQueriesData<DashboardUserData>(
        { queryKey: ["dashboard", "user", user.id] },
        (current) => {
          if (!current) return current;
          const alreadyExists = current.active.some((item) => item.quest.id === qid);
          if (alreadyExists) return current;

          return {
            ...current,
            active: [
              {
                id: `pending-${qid}`,
                status: "active",
                progress: 0,
                quest: selectedQuest,
              },
              ...current.active,
            ].slice(0, 6),
          };
        },
      );
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard", "user", user.id] }),
      queryClient.invalidateQueries({ queryKey: ["quests-catalog", user.id] }),
    ]);
    setOpenQuest(null);
  };

  const filtered = useMemo(
    () =>
      quests.filter((q) => {
        if (category !== "all" && q.category !== category) return false;
        if (filter && !q.title.toLowerCase().includes(filter.toLowerCase())) return false;
        return true;
      }),
    [category, filter, quests],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cats = ["all", "fitness", "mind", "study", "work", "social", "creative"];

  if (isAdmin) return null;

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
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Search quests..."
              className="w-full bg-input/60 border border-border rounded-md pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded text-xs uppercase tracking-wider border transition ${
                  category === c
                    ? "bg-accent/30 border-primary/50 text-primary-glow"
                    : "border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-accent/30 text-primary-glow">
                    {q.difficulty}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  {q.category} · {q.target_value} {q.unit}
                </p>
              </div>
              <span className="text-warning font-bold whitespace-nowrap">+{q.xp_reward} XP</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3 flex-1">{q.description}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                accept(q.id);
              }}
              disabled={accepted.has(q.id)}
              className="mt-4 btn-glow py-2 rounded font-semibold text-sm disabled:opacity-40"
            >
              <Sword className="inline w-4 h-4 mr-1" />
              {accepted.has(q.id) ? "Already accepted" : "Accept Quest"}
            </button>
          </div>
        ))}
        {paged.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-10">
            No quests match your search.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded text-sm border ${page === i + 1 ? "bg-accent/40 border-primary/50 text-primary-glow" : "border-border"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Workout detail dialog */}
      <Dialog open={!!openQuest} onOpenChange={(o) => !o && setOpenQuest(null)}>
        <DialogContent className="max-w-2xl glass-panel frame-corner border-primary/40 bg-background/95 backdrop-blur-xl">
          {openQuest &&
            (() => {
              const w = buildWorkout(openQuest);
              return (
                <>
                  <DialogHeader>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-primary-glow">
                      ▸ Training Protocol
                    </p>
                    <DialogTitle className="text-2xl glow-text flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-primary-glow" />
                      {openQuest.title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      {w.intro}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="my-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="glass-panel p-3 text-center">
                      <Target className="w-4 h-4 mx-auto text-primary-glow mb-1" />
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                        Difficulty
                      </p>
                      <p className="text-sm font-bold uppercase">{openQuest.difficulty}</p>
                    </div>
                    <div className="glass-panel p-3 text-center">
                      <Timer className="w-4 h-4 mx-auto text-primary-glow mb-1" />
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                        Duration
                      </p>
                      <p className="text-sm font-bold">{w.duration}</p>
                    </div>
                    <div className="glass-panel p-3 text-center">
                      <Flame className="w-4 h-4 mx-auto text-warning mb-1" />
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                        Reward
                      </p>
                      <p className="text-sm font-bold text-warning">+{openQuest.xp_reward} XP</p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                    {w.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 rounded-md border border-primary/30 bg-gradient-to-r ${MUSCLE_COLORS[ex.muscle] ?? "from-accent/20 to-transparent"} p-3`}
                      >
                        <BodyDiagram muscle={ex.muscle} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm truncate">{ex.name}</h4>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary-glow shrink-0">
                              {ex.muscle}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                            <div>
                              <p className="text-muted-foreground uppercase text-[10px]">Sets</p>
                              <p className="font-semibold">{ex.sets}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground uppercase text-[10px]">Reps</p>
                              <p className="font-semibold">{ex.reps}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground uppercase text-[10px]">Rest</p>
                              <p className="font-semibold">{ex.rest}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 pt-3 sm:flex-row">
                    <button
                      onClick={() => setOpenQuest(null)}
                      className="flex-1 py-2 rounded border border-border text-sm hover:bg-secondary/40 transition flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" /> Close
                    </button>
                    <button
                      onClick={() => accept(openQuest.id)}
                      disabled={accepted.has(openQuest.id)}
                      className="flex-[2] btn-glow py-2 rounded font-semibold text-sm disabled:opacity-40"
                    >
                      <Sword className="inline w-4 h-4 mr-1" />
                      {accepted.has(openQuest.id) ? "Already accepted" : "Accept Quest"}
                    </button>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
