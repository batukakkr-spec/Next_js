"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Shield, Users } from "lucide-react";

export const Route = createFileRoute("/_app/admin-users")({
  component: AdminUsersPage,
});

interface UserRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  level: number;
  xp: number;
  roles: ("admin" | "moderator" | "user")[];
}

function AdminUsersPage() {
  const { hasRole, loading, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [reloading, setReloading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !hasRole("admin")) {
      toast.error("Admin access required");
      navigate({ to: "/dashboard" });
    }
  }, [loading, hasRole, navigate]);

  const load = async () => {
    const [{ data: profiles, error: profileError }, { data: roleRows, error: roleError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, username, display_name, level, xp")
          .order("level", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

    if (profileError) throw profileError;
    if (roleError) throw roleError;

    const rolesByUser = new Map<string, UserRow["roles"]>();
    for (const row of (roleRows ?? []) as { user_id: string; role: UserRow["roles"][number] }[]) {
      const existing = rolesByUser.get(row.user_id) ?? [];
      if (!existing.includes(row.role)) {
        existing.push(row.role);
      }
      rolesByUser.set(row.user_id, existing);
    }

    setUsers(
      ((profiles ?? []) as Omit<UserRow, "roles">[]).map((profile) => ({
        ...profile,
        roles: rolesByUser.get(profile.user_id) ?? ["user"],
      })),
    );
  };

  useEffect(() => {
    if (!hasRole("admin")) return;

    void load().catch((error) => {
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    });
  }, [hasRole]);

  const reloadUsers = async () => {
    setReloading(true);
    try {
      await load();
      toast.success("User management refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reload users");
    } finally {
      setReloading(false);
    }
  };

  const promote = async (uid: string, role: "admin" | "moderator") => {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Granted ${role}`);
    await load();
  };

  const deleteUser = async (uid: string) => {
    if (uid === user?.id) {
      toast.error("Өөрийн admin account-оо эндээс устгах боломжгүй.");
      return;
    }

    const confirmed = window.confirm("Энэ хэрэглэгчийн account бүр мөсөн устна. Үргэлжлүүлэх үү?");
    if (!confirmed) return;

    setDeletingUserId(uid);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Session expired. Дахин нэвтэрнэ үү.");
      }

      const response = await fetch(`/api/admin/users/${uid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Failed to delete user");
      }

      toast.success("User account deleted");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  if (!hasRole("admin")) return null;

  return (
    <div className="space-y-6 animate-float-up">
      <div className="glass-panel frame-corner p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ Restricted Zone</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold glow-text">
          <Users className="text-primary-glow" /> ADMIN USER MANAGEMENT
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Хэрэглэгчдийн role, level, XP, болон account lifecycle-ийг тусдаа удирдах хэсэг.
          Moderator/Admin эрх олгох болон account устгах үйлдлийг эндээс хийнэ.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-md border border-primary/20 bg-secondary/30 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Users:</span>{" "}
            <span className="font-semibold text-primary-glow">{users.length}</span>
          </div>
          <div className="rounded-md border border-primary/20 bg-secondary/30 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Admins:</span>{" "}
            <span className="font-semibold text-primary-glow">
              {users.filter((entry) => entry.roles.includes("admin")).length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void reloadUsers()}
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
          <Shield className="h-5 w-5 text-primary-glow" />
          <h2 className="text-xl font-bold tracking-wider">User Roles and Accounts</h2>
        </div>

        <div className="glass-panel frame-corner overflow-hidden">
          {users.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Хэрэглэгчийн жагсаалт хоосон байна.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">User</th>
                  <th className="hidden p-3 text-left md:table-cell">Roles</th>
                  <th className="p-3 text-right">Level</th>
                  <th className="hidden p-3 text-right sm:table-cell">XP</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => (
                  <tr key={entry.user_id} className="border-t border-border">
                    <td className="p-3">
                      <p className="font-semibold">{entry.display_name ?? entry.username}</p>
                      <p className="text-xs text-muted-foreground">@{entry.username}</p>
                    </td>
                    <td className="hidden p-3 md:table-cell">
                      <div className="flex flex-wrap gap-2">
                        {entry.roles.map((role) => (
                          <span
                            key={role}
                            className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                              role === "admin"
                                ? "border-primary/40 bg-primary/10 text-primary-glow"
                                : role === "moderator"
                                  ? "border-primary/40 text-primary-glow"
                                  : "border-border text-muted-foreground"
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold glow-text">{entry.level}</td>
                    <td className="hidden p-3 text-right sm:table-cell">{entry.xp}</td>
                    <td className="space-x-2 p-3 text-right">
                      <button
                        onClick={() => void promote(entry.user_id, "moderator")}
                        className="rounded border border-border px-2 py-1 text-xs hover:bg-secondary/40"
                      >
                        +Mod
                      </button>
                      <button
                        onClick={() => void deleteUser(entry.user_id)}
                        disabled={deletingUserId === entry.user_id || entry.user_id === user?.id}
                        className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {deletingUserId === entry.user_id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
