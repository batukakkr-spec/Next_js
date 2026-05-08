"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const LoginPage = createAppRoutePage(() => import("@/routes/login"), "login");

export default LoginPage;
