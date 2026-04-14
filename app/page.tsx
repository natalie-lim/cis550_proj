import { MapExplorer } from "@/components/MapExplorer";
import { ZipSearchForm } from "@/components/ZipSearchForm";

export default function HomePage(): React.JSX.Element {
  const mapsKey: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            CIS 550 · Housing × Schools × Census
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Compare affordability, growth, and school quality across ZIP codes.
          </h1>
          <p className="text-base text-slate-600">
            This milestone scaffold wires five distinct pages to PostgreSQL-backed API routes.
            With <code className="rounded bg-slate-100 px-1">DATABASE_URL</code> unset, APIs
            fall back to curated mock JSON so the UI stays demo-ready.
          </p>
          <ZipSearchForm />
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Try:</span>
            {["90210", "10001", "60614"].map((zip) => (
              <a
                key={zip}
                href={`/zip/${zip}`}
                className="rounded-full bg-white px-3 py-1 font-medium text-accent shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                {zip}
              </a>
            ))}
          </div>
        </div>
        <MapExplorer apiKey={mapsKey} />
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        {[
          {
            title: "ZIP detail",
            body: "Housing time series, Census slice, and nearby schools for any ZIP."
          },
          {
            title: "Side-by-side compare",
            body: "Contrast growth, affordability index, and average school scores."
          },
          {
            title: "Insights lab",
            body: "Advanced SQL routes for growth, undervalued markets, and affordability."
          }
        ].map((card) => (
          <div key={card.title} className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">{card.title}</h2>
            <p className="text-sm text-slate-600">{card.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
