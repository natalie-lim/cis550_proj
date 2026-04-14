export default function AboutPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Methodology
        </p>
        <h1 className="text-3xl font-semibold text-ink">About HomeZone Insights</h1>
        <p className="text-base text-slate-600">
          This project integrates Zillow-style housing indices, U.S. Census American Community
          Survey statistics, and National Center for Education Statistics school profiles at the
          ZIP level. Milestone 3 focuses on cleaning, entity resolution, and loading data into AWS
          RDS PostgreSQL; this repository already ships a normalized schema and seed file for local
          iteration.
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">Datasets (proposal snapshot)</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Zillow Home Value Index extracts for ZIP-level trends.</li>
          <li>Census ACS 5-year tables for income, rent, commute, and education proxies.</li>
          <li>NCES / school reporting for test scores, ratios, and enrollment.</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">Cleaning roadmap</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Harmonize geography to ZIP (handle ZCTA crosswalks where needed).</li>
          <li>Preserve meaningful NULLs while median-imputing unstable Census fields.</li>
          <li>Smooth sparse housing months before computing growth metrics.</li>
          <li>Engineer affordability, YoY growth, and mismatch scores for API consumption.</li>
        </ul>
      </section>
    </div>
  );
}
