import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel frame-corner max-w-md p-8 text-center">
        <h1 className="glow-text text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold tracking-widest">DUNGEON NOT FOUND</h2>
        <p className="mt-2 text-sm text-muted-foreground">This gate has not yet been unlocked.</p>
        <Link
          href="/"
          className="btn-glow mt-6 inline-block rounded-md px-5 py-2 text-sm font-medium"
        >
          Return to entrance
        </Link>
      </div>
    </div>
  );
}
