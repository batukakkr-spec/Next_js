"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const AdminUsersPage = createAppRoutePage(() => import("@/routes/_app.admin-users"), "admin users");

export default AdminUsersPage;
