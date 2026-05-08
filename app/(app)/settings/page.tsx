"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const SettingsPage = createAppRoutePage(() => import("@/routes/_app.settings"), "settings");

export default SettingsPage;
