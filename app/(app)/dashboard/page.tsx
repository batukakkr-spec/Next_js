"use client";

import dynamic from "next/dynamic";

const DashboardPage = dynamic(
  () => import("@/routes/_app.dashboard").then((mod) => mod.Route.component),
  {
    ssr: false,
    loading: () => <div className="p-6 text-sm text-muted-foreground">Loading dashboard…</div>,
  },
);

export default DashboardPage;
