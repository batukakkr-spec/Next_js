"use client";

import { createAppRoutePage } from "@/components/app-route-page";

const ProfilePage = createAppRoutePage(() => import("@/routes/_app.profile"), "profile");

export default ProfilePage;
