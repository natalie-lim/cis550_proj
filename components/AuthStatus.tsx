"use client";

import { useAuth } from "@/components/AuthProvider";
import { firebaseAuth } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useMemo, useState } from "react";

export function AuthStatus(): React.JSX.Element {
  const { user, loading } = useAuth();
  const [working, setWorking] = useState(false);

  const label = useMemo(() => {
    if (loading) return "Loading…";
    if (!user) return "Sign in";
    return user.email ?? "Account";
  }, [loading, user]);

  const onSignOut = async (): Promise<void> => {
    setWorking(true);
    try {
      await signOut(firebaseAuth);
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <span className="rounded-full px-3 py-1 text-sm font-medium text-slate-500">
        {label}
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/account"
        className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-800"
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/history"
        className="rounded-full px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        History
      </Link>
      <button
        type="button"
        onClick={onSignOut}
        disabled={working}
        className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
      >
        Sign out
      </button>
    </div>
  );
}
