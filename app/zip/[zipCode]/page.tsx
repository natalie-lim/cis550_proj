import { HousingTrendChart } from "@/components/HousingTrendChart";
import { RecordZipView } from "@/components/RecordZipView";
import { getBaseUrl } from "@/lib/getBaseUrl";
import type { ZipDetailResponse } from "@/lib/types";
import { notFound } from "next/navigation";

async function fetchZip(zipCode: string): Promise<ZipDetailResponse> {
  const res: Response = await fetch(
    `${getBaseUrl()}/api/zip/${encodeURIComponent(zipCode)}`,
    { cache: "no-store" },
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
  props: ZipPageProps,
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
    maximumFractionDigits: 0,
  });

  function scoreOutOfTen(
    score: number | null,
    studentTeacherRatio: number | null
  ): number | null {
    if (score != null) {
      // NCES/SEDA-style scores are centered around 0, so map roughly [-2.5, 2.5] to [0, 10].
      return Math.max(0, Math.min(10, ((score + 2.5) / 5) * 10));
    }
    if (studentTeacherRatio != null) {
      // Public NCES proxy fallback: lower ratio is generally better.
      const normalized = ((30 - studentTeacherRatio) / (30 - 8)) * 10;
      return Math.max(0, Math.min(10, normalized));
    }
    return null;
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <RecordZipView
        zipCode={data.zip.zip_code}
        city={data.zip.city}
        state={data.zip.state}
      />
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          ZIP intelligence
        </p>
        <h1 className="text-3xl font-semibold text-ink">
          {data.zip.city}, {data.zip.state} · {data.zip.zip_code}
        </h1>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="ui-surface p-5">
          <h2 className="text-lg font-semibold text-ink">Housing trend</h2>
          <p className="text-sm text-slate-600">
            Modeled home values across reporting months.
          </p>
          <div className="mt-4">
            <HousingTrendChart data={data.housingSeries} />
          </div>
        </div>
        <div className="ui-surface p-5">
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

      <section className="ui-surface p-5">
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
                <th className="pb-2 pr-6">Academic rating (/10)</th>
                <th className="pb-2 pr-6">Students</th>
                <th className="pb-2 pr-6">Student/Teacher</th>
                <th className="pb-2 pr-6">Type</th>
                <th className="pb-2">Grades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.schools.map((school) => (
                <tr key={school.school_id}>
                  {(() => {
                    const normalizedScore = scoreOutOfTen(
                      school.test_score,
                      school.student_teacher_ratio
                    );
                    const scoreText =
                      normalizedScore == null ? "N/A" : `${normalizedScore.toFixed(1)}/10`;
                    return (
                      <>
                  <td className="py-2 pr-6 font-medium text-ink">{school.name}</td>
                  <td className="py-2 pr-6">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${scorePillClasses(normalizedScore)}`}
                    >
                      {scoreText}
                    </span>
                  </td>
                  <td className="py-2 pr-6">
                    {school.enrollment != null ? school.enrollment.toLocaleString("en-US") : "—"}
                  </td>
                  <td className="py-2 pr-6">
                    {school.student_teacher_ratio != null
                      ? school.student_teacher_ratio.toFixed(1)
                      : "—"}
                  </td>
                  <td className="py-2 pr-6">{school.school_type ?? "—"}</td>
                  <td className="py-2">{school.grade_range ?? "—"}</td>
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
