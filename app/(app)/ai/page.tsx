"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const AIPage = createAppRoutePage(() => import("@/routes/_app.ai"), "AI planner");

export default AIPage;
