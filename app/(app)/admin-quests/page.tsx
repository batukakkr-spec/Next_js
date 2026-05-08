"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const AdminQuestsPage = createAppRoutePage(
  () => import("@/routes/_app.admin-quests"),
  "admin quests",
);

export default AdminQuestsPage;
