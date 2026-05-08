"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const QuestsPage = createAppRoutePage(() => import("@/routes/_app.quests"), "quests");

export default QuestsPage;
