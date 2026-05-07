import { CompareSearchForm } from "@/components/CompareSearchForm";
import { getBaseUrl } from "@/lib/getBaseUrl";
import type { CompareResponse, CompareZipMetric } from "@/lib/types";
import Link from "next/link";

type ComparePageProps = {
  searchParams: Promise<{ zips?: string }>;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function locationLabel(row: CompareZipMetric): string {
  if (row.zip.city && row.zip.state) return `${row.zip.city}, ${row.zip.state}`;
  return row.zip.zip_code;
}

function buildDiffSentences(a: CompareZipMetric, b: CompareZipMetric): string[] {
  const locA = locationLabel(a);
  const locB = locationLabel(b);
  const sentences: string[] = [];

  if (a.latest_home_value != null && b.latest_home_value != null) {
    const diff = Math.abs(a.latest_home_value - b.latest_home_value);
    const [higher, lower] =
      a.latest_home_value >= b.latest_home_value ? [locA, locB] : [locB, locA];
    sentences.push(
      `${higher} has ${money.format(diff)} higher average home value compared to ${lower}.`
    );
  } else {
    sentences.push("Home value data unavailable for comparison.");
  }

  if (a.yoy_growth_pct != null && b.yoy_growth_pct != null) {
    const diff = Math.abs(a.yoy_growth_pct - b.yoy_growth_pct);
    const [higher, lower] =
      a.yoy_growth_pct >= b.yoy_growth_pct ? [locA, locB] : [locB, locA];
    sentences.push(
      `${higher} has ${diff.toFixed(1)}% higher growth (window) compared to ${lower}.`
    );
  } else {
    sentences.push("Growth data unavailable for comparison.");
  }

  if (a.affordability_index != null && b.affordability_index != null) {
    const diff = Math.abs(a.affordability_index - b.affordability_index);
    const [higher, lower] =
      a.affordability_index >= b.affordability_index ? [locA, locB] : [locB, locA];
    sentences.push(
      `${higher} has a ${diff.toFixed(2)} higher affordability index (price/income) compared to ${lower}.`
    );
  } else {
    sentences.push("Affordability data unavailable for comparison.");
  }

  if (a.avg_school_test_score != null && b.avg_school_test_score != null) {
    const diff = Math.abs(a.avg_school_test_score - b.avg_school_test_score);
    const [higher, lower] =
      a.avg_school_test_score >= b.avg_school_test_score ? [locA, locB] : [locB, locA];
    sentences.push(
      `${higher} has a ${diff.toFixed(1)} higher average school score compared to ${lower}.`
    );
  } else {
    sentences.push("School score data unavailable for comparison.");
  }

  if (a.census?.median_income != null && b.census?.median_income != null) {
    const diff = Math.abs(a.census.median_income - b.census.median_income);
    const [higher, lower] =
      a.census.median_income >= b.census.median_income ? [locA, locB] : [locB, locA];
    sentences.push(
      `${higher} has ${money.format(diff)} higher median income compared to ${lower}.`
    );
  } else {
    sentences.push("Median income data unavailable for comparison.");
  }

  return sentences;
}

export default async function ComparePage(
  props: ComparePageProps
): Promise<React.JSX.Element> {
  const searchParams = await props.searchParams;

  const requestedZips: string[] = searchParams.zips
    ? searchParams.zips
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean)
        .slice(0, 2)
    : [];

  const [defaultZip1 = "", defaultZip2 = ""] = requestedZips;

  let data: CompareResponse | null = null;

  if (requestedZips.length === 2) {
    const res: Response = await fetch(
      `${getBaseUrl()}/api/compare?zips=${encodeURIComponent(requestedZips.join(","))}`,
      { cache: "no-store" }
    );
    data = (await res.json()) as CompareResponse;
  }

  const foundZips = new Set(data?.zips.map((z) => z.zip.zip_code) ?? []);
  const notFoundZips = requestedZips.filter((z) => !foundZips.has(z));

  const zip1Data = requestedZips[0]
    ? data?.zips.find((z) => z.zip.zip_code === requestedZips[0])
    : undefined;
  const zip2Data = requestedZips[1]
    ? data?.zips.find((z) => z.zip.zip_code === requestedZips[1])
    : undefined;

  const bothFound = zip1Data != null && zip2Data != null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Compare ZIP codes
        </p>
        <h1 className="text-3xl font-semibold text-ink">Side-by-side markets</h1>
        <p className="text-sm text-slate-600">Enter two zip codes below to compare.</p>
      </div>

      <CompareSearchForm defaultZip1={defaultZip1} defaultZip2={defaultZip2} />

      {notFoundZips.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {notFoundZips.map((z) => (
            <p key={z}>ZIP code {z} is outside the scope of our data.</p>
          ))}
        </div>
      )}

      {bothFound && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {([zip1Data, zip2Data] as CompareZipMetric[]).map((row) => (
              <div
                key={row.zip.zip_code}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-slate-500">ZIP</p>
                    <p className="text-2xl font-semibold text-ink">{row.zip.zip_code}</p>
                    {row.zip.city && row.zip.state && (
                      <p className="text-sm text-slate-600">
                        {row.zip.city}, {row.zip.state}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/zip/${row.zip.zip_code}`}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Details →
                  </Link>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Average home value of the last year</dt>
                    <dd className="font-semibold">
                      {row.latest_home_value != null
                        ? money.format(row.latest_home_value)
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Growth (window)</dt>
                    <dd className="font-semibold">
                      {row.yoy_growth_pct != null
                        ? `${row.yoy_growth_pct.toFixed(1)}%`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Affordability (price/income)</dt>
                    <dd className="font-semibold">
                      {row.affordability_index != null
                        ? row.affordability_index.toFixed(2)
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Average school score</dt>
                    <dd className="font-semibold">
                      {row.avg_school_test_score != null
                        ? row.avg_school_test_score.toFixed(1)
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Median income</dt>
                    <dd className="font-semibold">
                      {row.census?.median_income != null
                        ? money.format(row.census.median_income)
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-ink">Key Differences</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {buildDiffSentences(zip1Data, zip2Data).map((sentence, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                  {sentence}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
