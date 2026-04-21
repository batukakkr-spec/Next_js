import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Sword } from "lucide-react";

type RoleChoice = "admin" | "user";

async function googleSignIn() {
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${window.location.origin}/dashboard`,
  });
  if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<RoleChoice>("user");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    // ensure clean state (in case a previous session lingered)
    await supabase.auth.signOut().catch(() => {});
    const { data: auth, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !auth.user) {
      setLoading(false);
      toast.error(error?.message ?? "Login failed");
      return;
    }
    // verify selected role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id);
    const hasRole = (roles ?? []).some((r) => r.role === role);
    setLoading(false);
    if (!hasRole) {
      await supabase.auth.signOut();
      toast.error(`This account does not have the ${role.toUpperCase()} role`);
      return;
    }
    toast.success("Welcome back, Hunter.");
    // hard navigate to make sure auth state is picked up everywhere
    window.location.href = role === "admin" ? "/admin" : "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Sword className="w-6 h-6 text-primary-glow" />
          <span className="font-bold tracking-widest glow-text">LEVELING</span>
        </Link>
        <div className="glass-panel frame-corner p-8 animate-float-up">
          <p className="text-xs uppercase tracking-[0.4em] text-primary-glow mb-2">▸ System Login</p>
          <h1 className="text-2xl font-bold glow-text mb-6">RE-ENTER THE GATE</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(["admin", "user"] as RoleChoice[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-2 rounded-md text-xs uppercase tracking-widest border transition ${
                      role === r
                        ? "bg-accent/40 border-primary/60 text-primary-glow shadow-[0_0_12px_oklch(0.7_0.18_240/0.4)]"
                        : "border-border text-muted-foreground hover:bg-input/40"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-input/60 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-input/60 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-glow py-3 rounded-md font-semibold tracking-wider disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "⚔ LOG IN"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={googleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-md border border-border bg-input/40 hover:bg-input/60 transition text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-1.9 1.4-4.3 2.2-7 2.2-5.3 0-9.7-3-11.4-7.3l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6 5.1c-.4.4 6.5-4.7 6.5-14.8 0-1.2-.1-2.3-.4-3.5z"/></svg>
            Continue with Google
          </button>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Not a Hunter yet?{" "}
            <Link to="/register" className="text-primary-glow hover:underline">Awaken now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
