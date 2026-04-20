import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Sword } from "lucide-react";

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
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back, Hunter.");
    navigate({ to: "/dashboard" });
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
          <p className="mt-6 text-sm text-muted-foreground text-center">
            Not a Hunter yet?{" "}
            <Link to="/register" className="text-primary-glow hover:underline">Awaken now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
