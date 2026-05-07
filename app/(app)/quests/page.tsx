"use client";

import dynamic from "next/dynamic";

const QuestsPage = dynamic(
  () => import("@/routes/_app.quests").then((mod) => mod.Route.component),
  {
    ssr: false,
    loading: () => <div className="p-6 text-sm text-muted-foreground">Loading quests…</div>,
  },
);

export default QuestsPage;
