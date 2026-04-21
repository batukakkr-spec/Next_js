import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Plus, Trash2, Pencil, Save, X, Power } from "lucide-react";

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
}

function AdminPage() {
  const { hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tab, setTab] = useState<"quests" | "users">("quests");
  const [editing, setEditing] = useState<Quest | null>(null);

  // form
  const [form, setForm] = useState({
    title: "", description: "", category: "fitness", difficulty: "easy",
    xp_reward: 25, target_value: 1, unit: "reps",
  });

  useEffect(() => {
    if (!loading && !hasRole("admin")) {
      toast.error("Admin access required");
      navigate({ to: "/dashboard" });
    }
  }, [loading, hasRole, navigate]);

  const load = async () => {
    const [{ data: q }, { data: u }] = await Promise.all([
      supabase.from("quests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, username, display_name, level, xp").order("level", { ascending: false }),
    ]);
    setQuests((q as Quest[]) ?? []);
    setUsers((u as UserRow[]) ?? []);
  };
  useEffect(() => { if (hasRole("admin")) void load(); }, [hasRole]);

  const createQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const { error } = await supabase.from("quests").insert({
      ...form,
      category: form.category as never,
      difficulty: form.difficulty as never,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Quest forged");
    setForm({ ...form, title: "", description: "" });
    await load();
  };

  const removeQuest = async (id: string) => {
    const { error } = await supabase.from("quests").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Quest removed");
    await load();
  };

  const toggleActive = async (q: Quest) => {
    const { error } = await supabase.from("quests")
      .update({ is_active: !q.is_active }).eq("id", q.id);
    if (error) { toast.error(error.message); return; }
    toast.success(q.is_active ? "Quest deactivated" : "Quest activated");
    await load();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { id, title, description, category, difficulty, xp_reward, target_value, unit, is_active } = editing;
    const { error } = await supabase.from("quests").update({
      title, description, category: category as never, difficulty: difficulty as never,
      xp_reward, target_value, unit, is_active,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Quest updated");
    setEditing(null);
    await load();
  };

  const promote = async (uid: string, role: "admin" | "moderator") => {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) { toast.error(error.message); return; }
    toast.success(`Granted ${role}`);
  };

  if (!hasRole("admin")) return null;

  return (
    <div className="space-y-6 animate-float-up">
      <div className="glass-panel frame-corner p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-warning">▸ Restricted Zone</p>
        <h1 className="text-3xl font-bold glow-text mt-1 flex items-center gap-2">
          <Shield className="text-warning" /> ADMIN CONSOLE
        </h1>
        <div className="flex gap-2 mt-4">
          {(["quests", "users"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-xs uppercase tracking-widest border ${
                tab === t ? "bg-accent/40 border-primary/50 text-primary-glow" : "border-border text-muted-foreground"
              }`}
            >{t}</button>
          ))}
        </div>
      </div>

      {tab === "quests" && (
        <>
          <form onSubmit={createQuest} className="glass-panel frame-corner p-6 grid sm:grid-cols-2 gap-3">
            <h3 className="sm:col-span-2 font-bold tracking-wider">▸ FORGE NEW QUEST</h3>
            <input required placeholder="Title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-input/60 border border-border rounded px-3 py-2 text-sm sm:col-span-2" />
            <input placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-input/60 border border-border rounded px-3 py-2 text-sm sm:col-span-2" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="bg-input/60 border border-border rounded px-3 py-2 text-sm">
              {["fitness", "mind", "study", "work", "social", "creative"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="bg-input/60 border border-border rounded px-3 py-2 text-sm">
              {["easy", "medium", "hard", "epic"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <input type="number" min={1} placeholder="XP" value={form.xp_reward}
              onChange={(e) => setForm({ ...form, xp_reward: +e.target.value })}
              className="bg-input/60 border border-border rounded px-3 py-2 text-sm" />
            <input type="number" min={1} placeholder="Target" value={form.target_value}
              onChange={(e) => setForm({ ...form, target_value: +e.target.value })}
              className="bg-input/60 border border-border rounded px-3 py-2 text-sm" />
            <button className="btn-glow rounded py-2 text-sm font-semibold sm:col-span-2">
              <Plus className="inline w-4 h-4 mr-1" /> Create Quest
            </button>
          </form>

          <div className="glass-panel frame-corner overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3 hidden sm:table-cell">Category</th>
                  <th className="text-left p-3 hidden md:table-cell">Difficulty</th>
                  <th className="text-right p-3">XP</th>
                  <th className="p-3 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quests.map((q) => (
                  <tr key={q.id} className="border-t border-border">
                    <td className="p-3">
                      <span className={q.is_active ? "" : "text-muted-foreground line-through"}>{q.title}</span>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{q.category}</td>
                    <td className="p-3 hidden md:table-cell text-primary-glow uppercase text-xs">{q.difficulty}</td>
                    <td className="p-3 text-right text-warning">+{q.xp_reward}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => toggleActive(q)} title={q.is_active ? "Deactivate" : "Activate"}
                          className={q.is_active ? "text-primary-glow hover:opacity-70" : "text-muted-foreground hover:opacity-70"}>
                          <Power className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditing(q)} title="Edit" className="text-primary-glow hover:opacity-70">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeQuest(q.id)} title="Delete" className="text-destructive hover:opacity-70">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editing && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setEditing(null)}>
              <div className="glass-panel frame-corner p-6 max-w-lg w-full grid sm:grid-cols-2 gap-3 animate-float-up"
                onClick={(e) => e.stopPropagation()}>
                <div className="sm:col-span-2 flex items-center justify-between">
                  <h3 className="font-bold tracking-wider">▸ EDIT QUEST</h3>
                  <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Title"
                  className="bg-input/60 border border-border rounded px-3 py-2 text-sm sm:col-span-2" />
                <input value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Description"
                  className="bg-input/60 border border-border rounded px-3 py-2 text-sm sm:col-span-2" />
                <select value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="bg-input/60 border border-border rounded px-3 py-2 text-sm">
                  {["fitness", "mind", "study", "work", "social", "creative"].map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={editing.difficulty}
                  onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}
                  className="bg-input/60 border border-border rounded px-3 py-2 text-sm">
                  {["easy", "medium", "hard", "epic"].map((c) => <option key={c}>{c}</option>)}
                </select>
                <input type="number" min={1} value={editing.xp_reward}
                  onChange={(e) => setEditing({ ...editing, xp_reward: +e.target.value })}
                  placeholder="XP"
                  className="bg-input/60 border border-border rounded px-3 py-2 text-sm" />
                <input type="number" min={1} value={editing.target_value}
                  onChange={(e) => setEditing({ ...editing, target_value: +e.target.value })}
                  placeholder="Target"
                  className="bg-input/60 border border-border rounded px-3 py-2 text-sm" />
                <input value={editing.unit ?? ""}
                  onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                  placeholder="Unit"
                  className="bg-input/60 border border-border rounded px-3 py-2 text-sm sm:col-span-2" />
                <label className="sm:col-span-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                  <input type="checkbox" checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                  Active
                </label>
                <button onClick={saveEdit}
                  className="btn-glow rounded py-2 text-sm font-semibold sm:col-span-2">
                  <Save className="inline w-4 h-4 mr-1" /> Save Changes
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "users" && (
        <div className="glass-panel frame-corner overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left p-3">User</th>
                <th className="text-right p-3">Level</th>
                <th className="text-right p-3 hidden sm:table-cell">XP</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-t border-border">
                  <td className="p-3">
                    <p className="font-semibold">{u.display_name ?? u.username}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </td>
                  <td className="p-3 text-right glow-text font-bold">{u.level}</td>
                  <td className="p-3 text-right hidden sm:table-cell">{u.xp}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => promote(u.user_id, "moderator")}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-secondary/40">
                      +Mod
                    </button>
                    <button onClick={() => promote(u.user_id, "admin")}
                      className="text-xs px-2 py-1 rounded border border-warning/40 text-warning hover:bg-warning/10">
                      +Admin
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
