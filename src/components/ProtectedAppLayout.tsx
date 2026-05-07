"use client";

import { Route as AppRoute } from "@/routes/_app";
import { OutletProvider } from "@/lib/router-compat";

export function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const Layout = AppRoute.component;

  return (
    <OutletProvider outlet={children}>
      <Layout />
    </OutletProvider>
  );
}
