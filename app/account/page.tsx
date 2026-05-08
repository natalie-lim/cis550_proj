"use client";

import { useAuth } from "@/components/AuthProvider";
import { firebaseAuth } from "@/lib/firebaseClient";
import { signInWithGoogle, signInWithYahoo } from "@/lib/socialAuth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export default function AccountPage(): React.JSX.Element {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<"google" | "yahoo" | null>(null);

  const busy = working || oauthBusy != null;

  const title = useMemo(
    () => (mode === "signin" ? "Sign in" : "Create account"),
    [mode],
  );

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setWorking(true);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(
          firebaseAuth,
          email.trim(),
          password,
        );
      }
      router.push("/history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setWorking(false);
    }
  };

  const onOAuth = async (which: "google" | "yahoo"): Promise<void> => {
    setError(null);
    setOauthBusy(which);
    try {
      if (which === "google") {
        await signInWithGoogle();
      } else {
        await signInWithYahoo();
      }
      router.push("/history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setOauthBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Firebase Authentication
          </p>
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          <p className="text-sm text-slate-600">
            Sign in to save your viewed ZIPs and come back to them later.
          </p>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-600">Loading…</p>
        ) : user ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-700">
              Signed in as{" "}
              <span className="font-semibold text-ink">
                {user.email ?? user.displayName ?? user.uid}
              </span>
              .
            </p>
            <Link
              href="/history"
              className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go to history
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void onOAuth("google")}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#166FE5] disabled:opacity-60"
              >
                {oauthBusy === "google" ? "Opening…" : "Google"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onOAuth("yahoo")}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#6001D2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4f018f] disabled:opacity-60"
              >
                {oauthBusy === "yahoo" ? "Opening…" : "Yahoo"}
              </button>
            </div>

            <div className="relative py-1">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden
              >
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-500">or email</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-accent focus:ring-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-accent focus:ring-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                Firebase requires at least 6 characters.
              </p>
            </div>

            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {working ? "Working…" : title}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setMode((m) => (m === "signin" ? "signup" : "signin"))
              }
              className="w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              {mode === "signin"
                ? "Need an account? Sign up"
                : "Have an account? Sign in"}
            </button>
          </form>
          </div>
        )}
      </div>
    </div>
  );
}
