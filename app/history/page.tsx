"use client";

import { useAuth } from "@/components/AuthProvider";
import { subscribeToZipViews, type ZipViewItem } from "@/lib/userHistory";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function formatTime(item: ZipViewItem): string {
  const date = item.createdAt?.toDate();
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function HistoryPage(): React.JSX.Element {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<ZipViewItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    return subscribeToZipViews({
      uid: user.uid,
      max: 30,
      onData: setItems,
      onError: (message) => setError(message),
    });
  }, [loading, user]);

  const subtitle = useMemo(() => {
    if (loading) return "Loading…";
    if (!user) return "Sign in to see ZIPs you’ve opened while signed in.";
    return "ZIPs you’ve viewed recently (saved while signed in).";
  }, [loading, user]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Your activity
        </p>
        <h1 className="text-3xl font-semibold text-ink">History</h1>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      {!loading && !user ? (
        <Link
          href="/account"
          className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Sign in
        </Link>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      ) : null}

      {user ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="p-5 text-sm text-slate-600">
                No ZIP views yet. Search a ZIP on the home page and open its detail
                page to add entries here.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/zip/${encodeURIComponent(item.zipCode)}`}
                      className="font-semibold text-ink hover:underline"
                    >
                      {item.zipCode}
                    </Link>
                    <div className="text-sm text-slate-600">
                      {item.city && item.state
                        ? `${item.city}, ${item.state}`
                        : "-"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-slate-500">
                    {formatTime(item)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
