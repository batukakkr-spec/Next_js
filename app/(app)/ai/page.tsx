"use client";

import dynamic from "next/dynamic";

const AIPage = dynamic(
  () => import("@/routes/_app.ai").then((mod) => mod.Route.component),
  {
    ssr: false,
    loading: () => <div className="p-6 text-sm text-muted-foreground">Loading AI planner…</div>,
  },
);

export default AIPage;
