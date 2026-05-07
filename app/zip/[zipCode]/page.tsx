import { HousingTrendChart } from "@/components/HousingTrendChart";
import { getBaseUrl } from "@/lib/getBaseUrl";
import type { ZipDetailResponse } from "@/lib/types";
import { notFound } from "next/navigation";

async function fetchZip(zipCode: string): Promise<ZipDetailResponse> {
  const res: Response = await fetch(
    `${getBaseUrl()}/api/zip/${encodeURIComponent(zipCode)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error("Failed to load ZIP");
  }
  return (await res.json()) as ZipDetailResponse;
}

type ZipPageProps = {
  params: Promise<{ zipCode: string }>;
};

export default async function ZipDetailPage(
  props: ZipPageProps
): Promise<React.JSX.Element> {
  const { zipCode } = await props.params;
  if (!zipCode) {
    notFound();
  }

  let data: ZipDetailResponse;
  try {
    data = await fetchZip(zipCode);
  } catch {
    notFound();
  }

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  function scoreLabel(score: number | null): string {
    if (score == null) return "—";
    if (score >= 1.0) return "Well above average";
    if (score >= 0.5) return "Above average";
    if (score >= -0.5) return "Average";
    if (score >= -1.0) return "Below average";
    return "Well below average";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          ZIP intelligence
        </p>
        <h1 className="text-3xl font-semibold text-ink">
          {data.zip.city}, {data.zip.state} · {data.zip.zip_code}
        </h1>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Housing trend</h2>
          <p className="text-sm text-slate-600">
            Modeled home values across reporting months.
          </p>
          <div className="mt-4">
            <HousingTrendChart data={data.housingSeries} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Census snapshot</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Median income</dt>
              <dd className="font-semibold text-ink">
                {data.census?.median_income != null
                  ? money.format(data.census.median_income)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Median rent</dt>
              <dd className="font-semibold text-ink">
                {data.census?.median_rent != null
                  ? money.format(data.census.median_rent)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Unemployment rate</dt>
              <dd className="font-semibold text-ink">
                {data.census?.unemployment_rate != null
                  ? `${data.census.unemployment_rate.toFixed(1)}%`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Poverty rate</dt>
              <dd className="font-semibold text-ink">
                {data.census?.poverty_rate != null
                  ? `${data.census.poverty_rate.toFixed(1)}%`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Commute (minutes)</dt>
              <dd className="font-semibold text-ink">
                {data.census?.commute_time != null
                  ? data.census.commute_time.toFixed(0)
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Nearby schools</h2>
          <span className="text-xs text-slate-500">
            {data.schools.length} record{data.schools.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2 pr-6">School</th>
                <th className="pb-2 pr-6">Academic rating</th>
                <th className="pb-2 pr-6">Type</th>
                <th className="pb-2">Grades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.schools.map((school) => (
                <tr key={school.school_id}>
                  <td className="py-2 pr-6 font-medium text-ink">{school.name}</td>
                  <td className="py-2 pr-6">{scoreLabel(school.test_score)}</td>
                  <td className="py-2 pr-6">{school.school_type ?? "—"}</td>
                  <td className="py-2">{school.grade_range ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
