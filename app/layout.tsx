import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { SiteNav } from "@/components/SiteNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HomeZone Insights",
  description:
    "Explore housing, Census, and school data together for smarter ZIP-level decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Required for useAuth() on /account, AuthStatus in nav, history, etc. */}
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <SiteNav />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-200 bg-white py-6 text-sm text-slate-600">
              <div className="mx-auto max-w-6xl px-4">
                CIS 5500 Final Project, created by Krishav Singla, Aarav Mulinti,
                Anika Sundararajan, Natalie Lim.
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
