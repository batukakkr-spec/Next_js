"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const AdminLoginPage = createAppRoutePage(() => import("@/routes/admin-login"), "admin login");

export default AdminLoginPage;
