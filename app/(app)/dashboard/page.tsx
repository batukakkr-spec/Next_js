"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const DashboardPage = createAppRoutePage(() => import("@/routes/_app.dashboard"), "dashboard");

export default DashboardPage;
