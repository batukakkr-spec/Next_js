"use client";

import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/login" });
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (loading || !isAuthenticated || !hasRole("admin")) return;

    const adminAllowedPaths = [
      "/admin",
      "/admin-quests",
      "/admin-users",
      "/dashboard",
      "/leaderboard",
      "/settings",
    ];
    const isAllowed = adminAllowedPaths.some((path) => location.pathname.startsWith(path));

    if (!isAllowed) {
      navigate({ to: "/admin" });
    }
  }, [loading, isAuthenticated, hasRole, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel frame-corner p-6 animate-pulse-glow">
          <p className="text-sm tracking-widest glow-text">SUMMONING SYSTEM…</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
