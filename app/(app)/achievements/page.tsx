"use client";

import dynamic from "next/dynamic";

const AchievementsPage = dynamic(
  () => import("@/routes/_app.achievements").then((mod) => mod.Route.component),
  {
    ssr: false,
    loading: () => <div className="p-6 text-sm text-muted-foreground">Loading achievements…</div>,
  },
);

export default AchievementsPage;
