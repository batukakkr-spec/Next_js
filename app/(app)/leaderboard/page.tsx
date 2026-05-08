"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const LeaderboardPage = createAppRoutePage(
  () => import("@/routes/_app.leaderboard"),
  "leaderboard",
);

export default LeaderboardPage;
