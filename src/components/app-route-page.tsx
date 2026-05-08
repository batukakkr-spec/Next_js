"use client";

import dynamic from "next/dynamic";

type RouteModule = {
  default?: React.ComponentType;
  Route?: { component?: React.ComponentType };
};

export function createAppRoutePage(loader: () => Promise<RouteModule>, loadingLabel: string) {
  return dynamic(
    async () => {
      const mod = await loader();
      const component = mod.default ?? mod.Route?.component;

      if (!component) {
        throw new Error(`Unable to load route component for ${loadingLabel}.`);
      }

      return component;
    },
    {
      ssr: false,
      loading: () => (
        <div className="p-6 text-sm text-muted-foreground">Loading {loadingLabel}…</div>
      ),
    },
  );
}
