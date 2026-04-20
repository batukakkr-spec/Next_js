import { createRouter, useRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel frame-corner p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold glow-text">SYSTEM ERROR</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="btn-glow px-4 py-2 rounded-md text-sm font-medium"
          >Retry</button>
          <a href="/" className="px-4 py-2 rounded-md border border-border text-sm">Home</a>
        </div>
      </div>
    </div>
  );
}

export const getRouter = () => {
  return createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });
};
