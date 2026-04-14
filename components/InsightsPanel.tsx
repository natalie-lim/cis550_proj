"use client";

import type { InsightListResponse } from "@/lib/types";
import { useCallback, useState } from "react";

type TabKey = "growth" | "undervalued" | "affordability";

export function InsightsPanel(): React.JSX.Element {
  const [tab, setTab] = useState<TabKey>("growth");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [data, setData] = useState<InsightListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runQuery = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      let path: string = "/api/insights/top-growth?limit=10";
      if (tab === "undervalued") {
        path = "/api/insights/undervalued?limit=10";
      }
      if (tab === "affordability") {
        const params: URLSearchParams = new URLSearchParams({ limit: "10" });
        if (stateFilter.trim().length === 2) {
          params.set("state", stateFilter.trim().toUpperCase());
        }
        path = `/api/insights/affordability?${params.toString()}`;
      }
      const res: Response = await fetch(path);
      if (!res.ok) {
        throw new Error("Request failed");
      }
      const json: InsightListResponse = (await res.json()) as InsightListResponse;
      setData(json);
    } catch {
      setError("Unable to load insights. Check API logs.");
    } finally {
      setLoading(false);
    }
  }, [tab, stateFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "growth" as const, label: "Top growth + below-median income" },
            { id: "undervalued" as const, label: "School quality vs price gap" },
            { id: "affordability" as const, label: "Affordability index" }
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-slate-200 transition ${
              tab === item.id
                ? "bg-accent text-white ring-accent"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "affordability" ? (
        <label className="flex max-w-xs flex-col gap-1 text-sm text-slate-700">
          Optional 2-letter state filter
          <input
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            maxLength={2}
            className="rounded-lg border border-slate-300 px-3 py-2 uppercase"
            placeholder="CA"
          />
        </label>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => void runQuery()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Running…" : "Run SQL-backed route"}
        </button>
        <span className="self-center text-xs text-slate-500">
          Routes live under <code className="rounded bg-slate-100 px-1">app/api/insights</code>
        </span>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      {data ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>{data.results.length} rows</span>
            <span className="font-semibold uppercase">source: {data.source}</span>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">ZIP</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Metric</th>
                <th className="px-4 py-2">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.map((row, index) => (
                <tr key={`${row.zip_code}-${index}`}>
                  <td className="px-4 py-3 font-semibold text-ink">{row.zip_code}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.city}, {row.state}
                  </td>
                  <td className="px-4 py-3">
                    {row.metric_value != null ? row.metric_value.toFixed(2) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Choose a tab and run a query to preview Milestone-style analytical outputs.
        </p>
      )}
    </div>
  );
}
