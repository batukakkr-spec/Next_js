"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const AdminPage = createAppRoutePage(() => import("@/routes/_app.admin"), "admin");

export default AdminPage;
