"use client";

// Interactive panel that runs three complex SQL-backed analytics queries and
// displays results in a table. Each tab targets a different family decision signal:
// price growth in accessible areas, school quality vs home cost, and affordability.

import type { InsightListResponse } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type TabKey = "growth" | "undervalued" | "affordability";

const TABS: ReadonlyArray<{ id: TabKey; label: string; description: string }> = [
  {
    id: "growth",
    label: "Rising & Affordable",
    description:
      "ZIP codes where home values are growing fastest among areas with below-median household income — good opportunities to buy before prices climb further."
  },
  {
    id: "undervalued",
    label: "Undervalued School Districts",
    description:
      "ZIP codes where school quality ranks higher than home prices within the same state — families get more school quality per dollar than comparable areas nearby."
  },
  {
    id: "affordability",
    label: "Most Affordable Areas",
    description:
      "ZIP codes with the lowest price-to-income ratio — where a typical salary goes furthest toward buying a home. Filter by state to compare within your region."
  }
];

const METRIC_LABELS: Record<TabKey, string> = {
  growth: "Home Value Growth",
  undervalued: "School vs Price Gap",
  affordability: "Price / Income Ratio"
};

// Avoid -0.0 by coercing negative zero; also guards against null (shown as N/A)
const METRIC_FORMAT: Record<TabKey, (v: number) => string> = {
  growth: (v) => `${(v || 0).toFixed(1)}%`,
  undervalued: (v) => `+${Math.round((v || 0) * 100)} pts`,
  affordability: (v) => (v || 0).toFixed(2)
};

export function InsightsPanel(): React.JSX.Element {
  const [tab, setTab] = useState<TabKey>("growth");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [data, setData] = useState<InsightListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runQuery = useCallback(
    async (currentTab: TabKey, currentState: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        let path: string = "/api/insights/top-growth?limit=10";
        if (currentTab === "undervalued") {
          path = "/api/insights/undervalued?limit=10";
        }
        if (currentTab === "affordability") {
          const params = new URLSearchParams({ limit: "10" });
          if (currentState.trim().length === 2) {
            params.set("state", currentState.trim().toUpperCase());
          }
          path = `/api/insights/affordability?${params.toString()}`;
        }
        const res: Response = await fetch(path);
        if (!res.ok) throw new Error("Request failed");
        const json: InsightListResponse = (await res.json()) as InsightListResponse;
        setData(json);
      } catch {
        setError("Unable to load insights. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-run on mount and whenever the tab changes
  useEffect(() => {
    void runQuery(tab, "");
  }, [tab, runQuery]);

  function handleTabChange(newTab: TabKey): void {
    setStateFilter("");
    setTab(newTab);
  }

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleTabChange(id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-slate-200 transition ${
              tab === id
                ? "bg-accent text-white ring-accent"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Per-tab description */}
      <p className="text-sm text-slate-600">{activeTab.description}</p>

      {/* State filter — only shown on affordability tab */}
      {tab === "affordability" && (
        <div className="flex items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Filter by state (optional)
            <input
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              maxLength={2}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 uppercase"
              placeholder="CA"
            />
          </label>
          <button
            type="button"
            onClick={() => void runQuery(tab, stateFilter)}
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            Apply filter
          </button>
          {stateFilter.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                setStateFilter("");
                void runQuery(tab, "");
              }}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              Remove filter
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading results…</p>
      ) : data ? (() => {
        // Filter out rows with null or effectively-zero metric values —
        // those only appear on the ZIP's own detail page when directly searched
        const visible = data.results.filter(
          (r) => r.metric_value != null && Math.abs(r.metric_value) > 0.001
        );
        return visible.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
              {visible.length} results
            </div>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">ZIP</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">{METRIC_LABELS[tab]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row, index) => (
                  <tr key={`${row.zip_code}-${index}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">
                      <Link
                        href={`/zip/${row.zip_code}`}
                        className="text-accent hover:underline"
                      >
                        {row.zip_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.city}, {row.state}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {METRIC_FORMAT[tab](row.metric_value!)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No results found for this selection.</p>
        );
      })() : (
        <p className="text-sm text-slate-500">No results found for this selection.</p>
      )}
    </div>
  );
}
