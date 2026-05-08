"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const AchievementsPage = createAppRoutePage(
  () => import("@/routes/_app.achievements"),
  "achievements",
);

export default AchievementsPage;
