import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    await supabase.auth.signOut().catch(() => {});
    const { data: auth, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !auth.user) {
      setLoading(false);
      toast.error(error?.message ?? "Login failed");
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    setLoading(false);
    if (!isAdmin) {
      await supabase.auth.signOut();
      toast.error("This account does not have ADMIN privileges");
      return;
    }
    toast.success("Welcome, Administrator.");
    window.location.href = "/admin";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[radial-gradient(circle_at_50%_30%,oklch(0.65_0.2_30/0.12),transparent_60%)]">
      <div className="w-full max-w-md">
        <div className="glass-panel frame-corner p-8 animate-float-up border-warning/30">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-warning" />
            <p className="text-xs uppercase tracking-[0.4em] text-warning">▸ Restricted Access</p>
          </div>
          <h1 className="text-2xl font-bold glow-text mb-6">ADMIN CONSOLE LOGIN</h1>

          <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-input/60 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-input/60 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading}
              className="w-full py-3 rounded-md font-semibold tracking-wider bg-warning/20 border border-warning/50 text-warning hover:bg-warning/30 transition disabled:opacity-50"
            >
              {loading ? "VERIFYING..." : "🛡 ENTER ADMIN ZONE"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Standard Hunter?{" "}
            <Link to="/login" className="text-primary-glow hover:underline">User login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}