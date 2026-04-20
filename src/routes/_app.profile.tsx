import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, refreshProfile, roles } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, username })
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    await refreshProfile();
  };

  return (
    <div className="space-y-6 animate-float-up max-w-2xl">
      <div className="glass-panel frame-corner p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ Hunter Profile</p>
        <h1 className="text-3xl font-bold glow-text mt-1">YOUR STATUS</h1>
      </div>

      <div className="glass-panel frame-corner p-6 flex flex-col sm:flex-row gap-6 items-center">
        <div className="w-24 h-24 rounded-full btn-glow flex items-center justify-center">
          <User className="w-10 h-10" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Hunter</p>
          <h2 className="text-2xl font-bold">{profile?.display_name ?? profile?.username}</h2>
          <p className="text-sm text-muted-foreground">@{profile?.username}</p>
          <div className="flex gap-2 mt-2 flex-wrap justify-center sm:justify-start">
            {roles.map((r) => (
              <span key={r} className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-accent/30 text-primary-glow">
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel frame-corner p-6 grid grid-cols-3 gap-3 text-center">
        <div><p className="text-2xl font-bold glow-text">Lv.{profile?.level}</p><p className="text-xs text-muted-foreground uppercase">Level</p></div>
        <div><p className="text-2xl font-bold">{profile?.xp}</p><p className="text-xs text-muted-foreground uppercase">XP</p></div>
        <div><p className="text-2xl font-bold">{profile?.streak_days}</p><p className="text-xs text-muted-foreground uppercase">Streak</p></div>
      </div>

      <div className="glass-panel frame-corner p-6 space-y-4">
        <h3 className="font-bold tracking-wider">▸ EDIT PROFILE</h3>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Display name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-input/60 border border-border rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-input/60 border border-border rounded-md px-3 py-2 text-sm" />
        </div>
        <button onClick={save} disabled={saving}
          className="btn-glow px-5 py-2 rounded-md text-sm font-semibold disabled:opacity-50">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
