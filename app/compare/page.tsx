import { getBaseUrl } from "@/lib/getBaseUrl";
import type { CompareResponse } from "@/lib/types";
import Link from "next/link";

type ComparePageProps = {
  searchParams: Promise<{ zips?: string }>;
};

export default async function ComparePage(
  props: ComparePageProps
): Promise<React.JSX.Element> {
  const searchParams = await props.searchParams;
  const zips: string = searchParams.zips ?? "90210,10001";
  const res: Response = await fetch(
    `${getBaseUrl()}/api/compare?zips=${encodeURIComponent(zips)}`,
    { cache: "no-store" }
  );
  const data: CompareResponse = (await res.json()) as CompareResponse;

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Compare ZIP codes
        </p>
        <h1 className="text-3xl font-semibold text-ink">Side-by-side markets</h1>
        <p className="text-sm text-slate-600">
          Pass comma-separated ZIPs via query string, e.g.{" "}
          <code className="rounded bg-slate-100 px-1">
            /compare?zips=90210,60614,10001
          </code>
          . Showing <span className="font-semibold">{zips}</span> · source{" "}
          <span className="font-semibold">{data.source}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {["90210,10001", "90210,60614", "60614,10001"].map((preset) => (
          <Link
            key={preset}
            href={`/compare?zips=${encodeURIComponent(preset)}`}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-accent shadow-sm hover:bg-slate-50"
          >
            {preset}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.zips.map((row) => (
          <div
            key={row.zip.zip_code}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-slate-500">ZIP</p>
                <p className="text-2xl font-semibold text-ink">{row.zip.zip_code}</p>
                <p className="text-sm text-slate-600">
                  {row.zip.city}, {row.zip.state}
                </p>
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
                <dt className="text-slate-500">Latest home value</dt>
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
                <dt className="text-slate-500">Affordability (price / income)</dt>
                <dd className="font-semibold">
                  {row.affordability_index != null
                    ? row.affordability_index.toFixed(2)
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Avg school score</dt>
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
    </div>
  );
}
