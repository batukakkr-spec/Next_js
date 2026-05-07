"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Save, X, Power, RefreshCw, Swords } from "lucide-react";

export const Route = createFileRoute("/_app/admin-quests")({
  component: AdminQuestsPage,
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

function AdminQuestsPage() {
  const { hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [editing, setEditing] = useState<Quest | null>(null);
  const [reloading, setReloading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "fitness",
    difficulty: "easy",
    xp_reward: 25,
    target_value: 1,
    unit: "reps",
  });

  useEffect(() => {
    if (!loading && !hasRole("admin")) {
      toast.error("Admin access required");
      navigate({ to: "/dashboard" });
    }
  }, [loading, hasRole, navigate]);

  const load = async () => {
    const { data, error } = await supabase
      .from("quests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    setQuests((data as Quest[]) ?? []);
  };

  useEffect(() => {
    if (!hasRole("admin")) return;

    void load().catch((error) => {
      toast.error(error instanceof Error ? error.message : "Failed to load quests");
    });
  }, [hasRole]);

  const reloadQuestData = async () => {
    setReloading(true);
    try {
      await load();
      toast.success("Quest data refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reload quests");
    } finally {
      setReloading(false);
    }
  };

  const createQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const { error } = await supabase.from("quests").insert({
      ...form,
      category: form.category as never,
      difficulty: form.difficulty as never,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Quest forged");
    setForm({ ...form, title: "", description: "" });
    await load();
  };

  const removeQuest = async (id: string) => {
    const { error } = await supabase.from("quests").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Quest removed");
    await load();
  };

  const toggleActive = async (quest: Quest) => {
    const { error } = await supabase
      .from("quests")
      .update({ is_active: !quest.is_active })
      .eq("id", quest.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(quest.is_active ? "Quest deactivated" : "Quest activated");
    await load();
  };

  const saveEdit = async () => {
    if (!editing) return;

    const {
      id,
      title,
      description,
      category,
      difficulty,
      xp_reward,
      target_value,
      unit,
      is_active,
    } = editing;
    const { error } = await supabase
      .from("quests")
      .update({
        title,
        description,
        category: category as never,
        difficulty: difficulty as never,
        xp_reward,
        target_value,
        unit,
        is_active,
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Quest updated");
    setEditing(null);
    await load();
  };

  if (!hasRole("admin")) return null;

  const activeQuestCount = quests.filter((quest) => quest.is_active).length;
  const averageXpReward =
    quests.length > 0
      ? Math.round(quests.reduce((sum, quest) => sum + quest.xp_reward, 0) / quests.length)
      : 0;

  return (
    <div className="space-y-6 animate-float-up">
      <div className="glass-panel frame-corner p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ Quest Forge</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold glow-text">
          <Swords className="text-primary-glow" /> QUEST MANAGEMENT
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Эндээс admin quest үүсгэх, засах, идэвхжүүлэх эсвэл archive хийх бүх удирдлага байна.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-md border border-primary/20 bg-secondary/30 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Total quests:</span>{" "}
            <span className="font-semibold text-primary-glow">{quests.length}</span>
          </div>
          <div className="rounded-md border border-primary/20 bg-secondary/30 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Active quests:</span>{" "}
            <span className="font-semibold text-primary-glow">{activeQuestCount}</span>
          </div>
          <div className="rounded-md border border-primary/20 bg-secondary/30 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Avg XP reward:</span>{" "}
            <span className="font-semibold text-primary-glow">{averageXpReward}</span>
          </div>
          <button
            type="button"
            onClick={() => void reloadQuestData()}
            disabled={reloading}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary/40 hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Plus className="h-5 w-5 text-primary-glow" />
          <h2 className="text-xl font-bold tracking-wider">Create Quest</h2>
        </div>

        <form
          onSubmit={createQuest}
          className="glass-panel frame-corner grid gap-3 p-6 sm:grid-cols-2"
        >
          <h3 className="sm:col-span-2 font-bold tracking-wider">▸ FORGE NEW QUEST</h3>
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded border border-border bg-input/60 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded border border-border bg-input/60 px-3 py-2 text-sm sm:col-span-2"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded border border-border bg-input/60 px-3 py-2 text-sm"
          >
            {["fitness", "mind", "study", "work", "social", "creative"].map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            className="rounded border border-border bg-input/60 px-3 py-2 text-sm"
          >
            {["easy", "medium", "hard", "epic"].map((difficulty) => (
              <option key={difficulty}>{difficulty}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            placeholder="XP"
            value={form.xp_reward}
            onChange={(e) => setForm({ ...form, xp_reward: +e.target.value })}
            className="rounded border border-border bg-input/60 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={1}
            placeholder="Target"
            value={form.target_value}
            onChange={(e) => setForm({ ...form, target_value: +e.target.value })}
            className="rounded border border-border bg-input/60 px-3 py-2 text-sm"
          />
          <button className="btn-glow rounded py-2 text-sm font-semibold sm:col-span-2">
            <Plus className="mr-1 inline h-4 w-4" /> Create Quest
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Swords className="h-5 w-5 text-primary-glow" />
          <h2 className="text-xl font-bold tracking-wider">Quest Library</h2>
        </div>

        <div className="glass-panel frame-corner overflow-hidden">
          {quests.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Quest хараахан алга байна. Дээрх form-оор анхны quest-ээ үүсгэнэ үү.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Title</th>
                  <th className="hidden p-3 text-left sm:table-cell">Category</th>
                  <th className="hidden p-3 text-left md:table-cell">Difficulty</th>
                  <th className="p-3 text-right">XP</th>
                  <th className="w-32 p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quests.map((quest) => (
                  <tr key={quest.id} className="border-t border-border">
                    <td className="p-3">
                      <span className={quest.is_active ? "" : "text-muted-foreground line-through"}>
                        {quest.title}
                      </span>
                    </td>
                    <td className="hidden p-3 text-muted-foreground sm:table-cell">
                      {quest.category}
                    </td>
                    <td className="hidden p-3 text-xs uppercase text-primary-glow md:table-cell">
                      {quest.difficulty}
                    </td>
                    <td className="p-3 text-right text-primary-glow">+{quest.xp_reward}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(quest)}
                          title={quest.is_active ? "Deactivate" : "Activate"}
                          className={
                            quest.is_active
                              ? "text-primary-glow hover:opacity-70"
                              : "text-muted-foreground hover:opacity-70"
                          }
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditing(quest)}
                          title="Edit"
                          className="text-primary-glow hover:opacity-70"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeQuest(quest.id)}
                          title="Delete"
                          className="text-destructive hover:opacity-70"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div
            className="glass-panel frame-corner grid w-full max-w-lg gap-3 p-6 sm:grid-cols-2 animate-float-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:col-span-2 flex items-center justify-between">
              <h3 className="font-bold tracking-wider">▸ EDIT QUEST</h3>
              <button
                onClick={() => setEditing(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="Title"
              className="rounded border border-border bg-input/60 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              value={editing.description ?? ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Description"
              className="rounded border border-border bg-input/60 px-3 py-2 text-sm sm:col-span-2"
            />
            <select
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              className="rounded border border-border bg-input/60 px-3 py-2 text-sm"
            >
              {["fitness", "mind", "study", "work", "social", "creative"].map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <select
              value={editing.difficulty}
              onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}
              className="rounded border border-border bg-input/60 px-3 py-2 text-sm"
            >
              {["easy", "medium", "hard", "epic"].map((difficulty) => (
                <option key={difficulty}>{difficulty}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={editing.xp_reward}
              onChange={(e) => setEditing({ ...editing, xp_reward: +e.target.value })}
              placeholder="XP"
              className="rounded border border-border bg-input/60 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={1}
              value={editing.target_value}
              onChange={(e) => setEditing({ ...editing, target_value: +e.target.value })}
              placeholder="Target"
              className="rounded border border-border bg-input/60 px-3 py-2 text-sm"
            />
            <input
              value={editing.unit ?? ""}
              onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
              placeholder="Unit"
              className="rounded border border-border bg-input/60 px-3 py-2 text-sm sm:col-span-2"
            />
            <label className="sm:col-span-2 flex items-center gap-2 text-xs uppercase tracking-widest">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
              />
              Active
            </label>
            <button
              onClick={() => void saveEdit()}
              className="btn-glow rounded py-2 text-sm font-semibold sm:col-span-2"
            >
              <Save className="mr-1 inline h-4 w-4" /> Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
