"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const RegisterPage = createAppRoutePage(() => import("@/routes/register"), "register");

export default RegisterPage;
