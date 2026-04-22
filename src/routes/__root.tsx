import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel frame-corner p-8 max-w-md text-center">
        <h1 className="text-7xl font-bold glow-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold tracking-widest">DUNGEON NOT FOUND</h2>
        <p className="mt-2 text-sm text-muted-foreground">This gate has not yet been unlocked.</p>
        <Link to="/" className="mt-6 inline-block btn-glow px-5 py-2 rounded-md text-sm font-medium">
          Return to entrance
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LEVELING — Gamified Quest System" },
      { name: "description", content: "Gamified self-improvement system. Complete daily quests, level up, climb the leaderboard." },
      { name: "author", content: "Indra Cyber Institute" },
      { property: "og:title", content: "LEVELING — Gamified Quest System" },
      { property: "og:description", content: "Awaken your potential. Complete quests, gain XP, level up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "/app-logo.png" },
      { name: "twitter:image", content: "/app-logo.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/app-logo.png" },
      { rel: "apple-touch-icon", href: "/app-logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
