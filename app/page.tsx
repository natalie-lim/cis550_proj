import { ZipSearchForm } from "@/components/ZipSearchForm";

export default function HomePage(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:py-12">
      <section className="ui-surface space-y-5 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          CIS 550 · Housing × Schools × Census
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          Compare affordability, growth, and school quality across ZIP codes.
        </h1>
        <p className="text-base text-slate-600">
          HomeZone Insights combines housing price data, U.S. Census statistics, and school
          quality metrics to help you understand housing markets at the ZIP code level. Search
          any ZIP to see price trends, affordability, and nearby school scores, or compare two
          markets side by side.
        </p>
        <ZipSearchForm />
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">Try:</span>
          {["90001", "10001", "60614"].map((zip) => (
            <a
              key={zip}
              href={`/zip/${zip}`}
              className="inline-flex h-10 items-center rounded-full bg-white px-5 font-semibold leading-none text-accent shadow-sm ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-slate-50"
            >
              {zip}
            </a>
          ))}
        </div>
      </section>

      <section className="ui-surface grid gap-4 p-6 md:grid-cols-3">
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
          <div key={card.title} className="space-y-2 rounded-xl bg-white/75 p-4 ring-1 ring-slate-100">
            <h2 className="text-lg font-semibold text-ink">{card.title}</h2>
            <p className="text-sm text-slate-600">{card.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
