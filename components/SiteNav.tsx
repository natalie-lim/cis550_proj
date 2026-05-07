"use client";

import { AuthStatus } from "@/components/AuthStatus";
import Link from "next/link";

const links: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/compare", label: "Compare" },
  { href: "/insights", label: "Insights" },
  { href: "/history", label: "History" },
  { href: "/about", label: "About" },
];

export function SiteNav(): React.JSX.Element {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          HomeZone <span className="text-accent">Insights</span>
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <nav className="flex flex-wrap gap-3 text-sm font-medium text-slate-700">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
