"use client";

import NextLink from "next/link";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  to: string;
};

type OutletContextValue = ReactNode;

const OutletContext = createContext<OutletContextValue>(null);

export function OutletProvider({
  children,
  outlet,
}: {
  children: ReactNode;
  outlet: ReactNode;
}) {
  return <OutletContext.Provider value={outlet}>{children}</OutletContext.Provider>;
}

export function Outlet() {
  return useContext(OutletContext);
}

export function LinkCompat({ to, ...props }: LinkProps) {
  return <NextLink href={to} {...props} />;
}

export { LinkCompat as Link };

export function useNavigate() {
  const router = useNextRouter();

  return ({ to, replace }: { to: string; replace?: boolean }) => {
    if (replace) {
      router.replace(to);
      return;
    }

    router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname() ?? "/";
  return { pathname };
}

export function useRouter() {
  const router = useNextRouter();
  return {
    invalidate: () => router.refresh(),
  };
}

export function createFileRoute(path: string) {
  return <T extends Record<string, unknown>>(config: T) => ({
    path,
    ...config,
  });
}

export function createRouter<T extends Record<string, unknown>>(config: T) {
  return config;
}

export function createRootRoute<T extends Record<string, unknown>>(config: T) {
  return config;
}

export function HeadContent() {
  return null;
}

export function Scripts() {
  return null;
}
