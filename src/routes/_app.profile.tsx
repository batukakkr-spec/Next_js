"use client";

import Image from "next/image";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import hunterFigure from "@/assets/sidebar-shadow-hunter.png";
import { Camera, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, refreshProfile, roles } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (file: File) => {
    if (!profile) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${profile.user_id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_url: pub.publicUrl })
      .eq("user_id", profile.user_id);
    setUploading(false);
    if (updErr) {
      toast.error(updErr.message);
      return;
    }
    toast.success("Avatar updated");
    await refreshProfile();
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, username })
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    await refreshProfile();
  };

  return (
    <div className="profile-layout animate-float-up">
      <div className="profile-main space-y-6">
        <div className="glass-panel frame-corner relative overflow-hidden p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_50%,oklch(0.54_0.22_298/0.18),transparent_28%)]" />
          <div className="pointer-events-none absolute right-[-12px] top-1/2 hidden -translate-y-1/2 sm:block">
            <Image
              src={hunterFigure}
              alt=""
              width={180}
              height={180}
              sizes="180px"
              className="w-[180px] scale-x-[-1] object-contain opacity-12 blur-[1px] saturate-150"
            />
          </div>
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.4em] text-primary-glow">▸ Hunter Profile</p>
            <h1 className="mt-1 text-3xl font-bold glow-text">YOUR STATUS</h1>
          </div>
        </div>

        <div className="glass-panel frame-corner relative flex flex-col items-center gap-4 overflow-hidden p-4 sm:flex-row sm:gap-6 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_50%,oklch(0.54_0.22_298/0.18),transparent_24%),radial-gradient(circle_at_82%_50%,oklch(0.56_0.20_304/0.10),transparent_20%)]" />
          <div className="pointer-events-none absolute right-[-28px] top-1/2 hidden -translate-y-1/2 sm:block">
            <Image
              src={hunterFigure}
              alt=""
              width={210}
              height={210}
              sizes="210px"
              className="w-[210px] scale-x-[-1] object-contain opacity-10 blur-[1px] saturate-150"
            />
          </div>
          <div className="relative group">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="w-24 h-24 rounded-full btn-glow flex items-center justify-center overflow-hidden relative"
              title="Change avatar"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <Image
                  src={hunterFigure}
                  alt="hunter avatar"
                  width={96}
                  height={96}
                  sizes="96px"
                  className="h-full w-full object-cover"
                />
              )}
              <span className="absolute inset-0 bg-background/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-primary-glow" />
                )}
              </span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadAvatar(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="relative z-10 flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Hunter</p>
            <h2 className="text-2xl font-bold">{profile?.display_name ?? profile?.username}</h2>
            <p className="text-sm text-muted-foreground">@{profile?.username}</p>
            <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              {roles.map((r) => (
                <span
                  key={r}
                  className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-accent/30 text-primary-glow"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel frame-corner grid grid-cols-1 gap-3 p-4 text-center sm:grid-cols-3 sm:p-6">
          <div>
            <p className="text-2xl font-bold glow-text">Lv.{profile?.level}</p>
            <p className="text-xs text-muted-foreground uppercase">Level</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{profile?.xp}</p>
            <p className="text-xs text-muted-foreground uppercase">XP</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{profile?.streak_days}</p>
            <p className="text-xs text-muted-foreground uppercase">Streak</p>
          </div>
        </div>

        <div className="glass-panel frame-corner p-6 space-y-4">
          <h3 className="font-bold tracking-wider">▸ EDIT PROFILE</h3>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-input/60 border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-input/60 border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="btn-glow px-5 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
