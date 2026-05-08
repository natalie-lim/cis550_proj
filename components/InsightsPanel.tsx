"use client";

import type { InsightListResponse, InsightRow } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type TabKey = "growth" | "undervalued" | "affordability";

const PAGE_SIZE = 10;
const MAX_PAGES = 5;

const TABS: ReadonlyArray<{ id: TabKey; label: string; description: string }> = [
  {
    id: "growth",
    label: "Emerging Value Markets",
    description:
      "Top 50 ZIP codes where home values are growing fastest among areas with below-median household income, showing strong momentum in markets that are still relatively accessible."
  },
  {
    id: "undervalued",
    label: "Undervalued School Districts",
    description:
      "Top 50 ZIP codes where school quality ranks higher than home prices within the same state, so families get more school quality per dollar than comparable areas nearby."
  },
  {
    id: "affordability",
    label: "Best Price-to-Income Value",
    description:
      "Top 50 ZIP codes with the lowest price-to-income ratio, where a typical salary goes furthest toward buying a home. Filter by state to compare within your region."
  }
];

const METRIC_LABELS: Record<TabKey, string> = {
  growth: "Home Value Growth",
  undervalued: "School vs Price Gap",
  affordability: "Price / Income Ratio"
};

// Avoid -0.0 by coercing negative zero
const METRIC_FORMAT: Record<TabKey, (v: number) => string> = {
  growth: (v) => `${(v || 0).toFixed(1)}%`,
  undervalued: (v) => `+${Math.round((v || 0) * 100)} pts`,
  affordability: (v) => (v || 0).toFixed(2)
};

// Per-tab validity: affordability filters only null (any positive ratio is meaningful);
// growth and undervalued also filter near-zero values since 0% growth / 0-gap is noise.
function isValidRow(tab: TabKey, row: InsightRow): boolean {
  if (row.metric_value == null) return false;
  if (tab === "affordability") return row.metric_value > 0;
  return Math.abs(row.metric_value) > 0.001;
}

export function InsightsPanel(): React.JSX.Element {
  const [tab, setTab] = useState<TabKey>("growth");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [data, setData] = useState<InsightListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);

  const runQuery = useCallback(
    async (currentTab: TabKey, currentState: string): Promise<void> => {
      setLoading(true);
      setError(null);
      setPage(0);
      try {
        let path: string = `/api/insights/top-growth?limit=${PAGE_SIZE * MAX_PAGES}`;
        if (currentTab === "undervalued") {
          path = `/api/insights/undervalued?limit=${PAGE_SIZE * MAX_PAGES}`;
        }
        if (currentTab === "affordability") {
          const params = new URLSearchParams({ limit: String(PAGE_SIZE * MAX_PAGES) });
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

  useEffect(() => {
    void runQuery(tab, "");
  }, [tab, runQuery]);

  function handleTabChange(newTab: TabKey): void {
    setStateFilter("");
    setPage(0);
    setTab(newTab);
  }

  const activeTab = TABS.find((t) => t.id === tab)!;

  const allValid = data
    ? data.results.filter((r) => isValidRow(tab, r))
    : [];
  const totalPages = Math.min(MAX_PAGES, Math.ceil(allValid.length / PAGE_SIZE));
  const pageRows = allValid.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleTabChange(id)}
            className={`ui-touch rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 ${
              tab === id
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-blue-500 shadow"
                : "bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Per-tab description */}
      <p className="text-sm text-slate-600">{activeTab.description}</p>

      {/* State filter, shown only on affordability tab */}
      {tab === "affordability" && (
        <div className="ui-surface flex flex-wrap items-end gap-3 p-4">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Filter by state (optional)
            <input
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              maxLength={2}
              className="ui-input w-24 uppercase"
              placeholder="CA"
            />
          </label>
          <button
            type="button"
            onClick={() => void runQuery(tab, stateFilter)}
            disabled={loading}
            className="ui-button-primary disabled:opacity-60"
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
              className="ui-button-secondary disabled:opacity-60"
            >
              Remove filter
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading results…</p>
      ) : pageRows.length > 0 ? (
        <div className="space-y-3">
          <div className="ui-surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, allValid.length)} of{" "}
                {allValid.length} results
              </span>
              {/* Pagination arrows */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="ui-touch rounded px-2 py-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  aria-label="Previous page"
                >
                  ←
                </button>
                <span className="px-1">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="ui-touch rounded px-2 py-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  aria-label="Next page"
                >
                  →
                </button>
              </div>
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
                {pageRows.map((row, index) => (
                  <tr key={`${row.zip_code}-${index}`} className="hover:bg-blue-50/40">
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
        </div>
      ) : (
        !loading && data != null && (
          <p className="text-sm text-slate-500">No results found for this selection.</p>
        )
      )}

    </div>
  );
}
