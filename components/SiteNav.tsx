"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/compare", label: "Compare" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" }
];

export function SiteNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight text-ink hover:opacity-90">
          HomeZone <span className="text-accent">Insights</span>
        </Link>
        <nav className="flex flex-wrap gap-2 text-sm font-medium text-slate-700">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex h-10 items-center rounded-full px-4 ${
                pathname === link.href
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
