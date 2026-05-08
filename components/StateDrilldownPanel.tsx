"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StateHomeValueRow = {
  state: string;
  num_zips: number;
  avg_home_value: number;
  min_home_value: number;
  max_home_value: number;
};

type TopSchoolRow = {
  school_id: number;
  name: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  test_score: number | null;
};

type TopSchoolsResponse = {
  state: string;
  schools: TopSchoolRow[];
  source: "database" | "mock";
};

function normalizeTestScore(score: number | null): number | null {
  if (score == null) return null;
  return Math.max(0, Math.min(10, ((score + 2.5) / 5) * 10));
}

function scorePillClasses(normalizedScore: number | null): string {
  if (normalizedScore == null) {
    return "bg-slate-100 text-slate-600";
  }
  if (normalizedScore >= 8) {
    return "bg-emerald-200 text-emerald-900";
  }
  if (normalizedScore >= 6) {
    return "bg-green-100 text-green-800";
  }
  if (normalizedScore >= 4) {
    return "bg-yellow-100 text-yellow-800";
  }
  if (normalizedScore >= 2) {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-red-200 text-red-900";
}

export function StateDrilldownPanel(): React.JSX.Element {
  const STATES_PER_PAGE = 10;
  const MAX_PAGES = 5;

  const [stateRows, setStateRows] = useState<StateHomeValueRow[]>([]);
  const [stateRowsLoading, setStateRowsLoading] = useState<boolean>(false);
  const [stateRowsError, setStateRowsError] = useState<string | null>(null);
  const [stateSearch, setStateSearch] = useState<string>("");
  const [statePage, setStatePage] = useState<number>(0);
  const [selectedState, setSelectedState] = useState<string>("");
  const [topSchools, setTopSchools] = useState<TopSchoolRow[]>([]);
  const [topSchoolsLoading, setTopSchoolsLoading] = useState<boolean>(false);
  const [topSchoolsError, setTopSchoolsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStateHomeValues(): Promise<void> {
      setStateRowsLoading(true);
      setStateRowsError(null);
      try {
        const res: Response = await fetch("/api/insights/state-home-values?order=desc");
        if (!res.ok) throw new Error("Request failed");
        const rows: StateHomeValueRow[] = (await res.json()) as StateHomeValueRow[];
        setStateRows(rows);
        if (rows.length > 0) {
          setSelectedState((prev) => prev || rows[0]!.state);
        }
      } catch {
        setStateRowsError("Unable to load state overview.");
      } finally {
        setStateRowsLoading(false);
      }
    }
    void loadStateHomeValues();
  }, []);

  useEffect(() => {
    async function loadTopSchools(): Promise<void> {
      if (!selectedState) {
        setTopSchools([]);
        return;
      }
      setTopSchoolsLoading(true);
      setTopSchoolsError(null);
      try {
        const res: Response = await fetch(
          `/api/state/${encodeURIComponent(selectedState)}/top-schools?limit=25`
        );
        if (!res.ok) throw new Error("Request failed");
        const body: TopSchoolsResponse = (await res.json()) as TopSchoolsResponse;
        setTopSchools(body.schools ?? []);
      } catch {
        setTopSchoolsError("Unable to load top schools for this state.");
      } finally {
        setTopSchoolsLoading(false);
      }
    }
    void loadTopSchools();
  }, [selectedState]);

  const filteredStateRows = stateRows.filter((row) =>
    row.state.toUpperCase().includes(stateSearch.trim().toUpperCase())
  );
  const totalStatePages = Math.min(
    MAX_PAGES,
    Math.max(1, Math.ceil(filteredStateRows.length / STATES_PER_PAGE))
  );
  const pagedStateRows = filteredStateRows.slice(
    statePage * STATES_PER_PAGE,
    (statePage + 1) * STATES_PER_PAGE
  );

  return (
    <section className="space-y-3">
      <div className="ui-surface space-y-2 p-4">
        <h3 className="text-base font-semibold text-ink">State-level drill-down</h3>
        <p className="text-sm text-slate-600">
          Compare latest home-value distributions by state, then drill into the selected state&apos;s
          top schools.
        </p>
      </div>

      {stateRowsError && <p className="text-sm text-red-600">{stateRowsError}</p>}

      {stateRowsLoading ? (
        <p className="text-sm text-slate-500">Loading state overview…</p>
      ) : filteredStateRows.length > 0 ? (
        <div className="ui-surface overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-500">
              Search state
              <input
                value={stateSearch}
                onChange={(e) => {
                  setStateSearch(e.target.value.toUpperCase());
                  setStatePage(0);
                }}
                maxLength={2}
                className="ui-input w-24 uppercase text-sm normal-case"
                placeholder="CA"
              />
            </label>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setStatePage((p) => Math.max(0, p - 1))}
                disabled={statePage === 0}
                className="ui-touch rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
              >
                Prev
              </button>
              <span>
                {statePage + 1} / {totalStatePages}
              </span>
              <button
                type="button"
                onClick={() => setStatePage((p) => Math.min(totalStatePages - 1, p + 1))}
                disabled={statePage >= totalStatePages - 1}
                className="ui-touch rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">State</th>
                <th className="px-4 py-2">Avg Home Value</th>
                <th className="px-4 py-2">Min</th>
                <th className="px-4 py-2">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedStateRows.map((row) => (
                <tr
                  key={row.state}
                  className={`cursor-pointer hover:bg-blue-50/40 ${
                    selectedState === row.state ? "bg-blue-50/60" : ""
                  }`}
                  onClick={() => setSelectedState(row.state)}
                >
                  <td className="px-4 py-3 font-semibold">{row.state}</td>
                  <td className="px-4 py-3 text-slate-700">
                    ${row.avg_home_value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    ${row.min_home_value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    ${row.max_home_value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No states match this search.</p>
      )}

      <div className="ui-surface space-y-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Top schools state
            <input
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value.trim().toUpperCase())}
              maxLength={2}
              className="ui-input w-24 uppercase"
              placeholder="PA"
            />
          </label>
        </div>

        {topSchoolsError && <p className="text-sm text-red-600">{topSchoolsError}</p>}

        {topSchoolsLoading ? (
          <p className="text-sm text-slate-500">Loading top schools…</p>
        ) : topSchools.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">School</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">ZIP</th>
                  <th className="px-4 py-2">Academic rating (/10)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topSchools.map((school) => (
                  <tr key={school.school_id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-medium text-slate-800">{school.name}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {school.city}, {school.state}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {school.zip_code ? (
                        <Link href={`/zip/${school.zip_code}`} className="text-accent hover:underline">
                          {school.zip_code}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {(() => {
                        const normalized = normalizeTestScore(school.test_score);
                        return (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${scorePillClasses(normalized)}`}
                          >
                            {normalized != null ? `${normalized.toFixed(1)}/10` : "N/A"}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No school results for this state.</p>
        )}
      </div>
    </section>
  );
}
