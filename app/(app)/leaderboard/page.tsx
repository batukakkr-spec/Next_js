"use client";

import dynamic from "next/dynamic";

const LeaderboardPage = dynamic(
  () => import("@/routes/_app.leaderboard").then((mod) => mod.Route.component),
  {
    ssr: false,
    loading: () => <div className="p-6 text-sm text-muted-foreground">Loading leaderboard…</div>,
  },
);

export default LeaderboardPage;
