import { InsightsPanel } from "@/components/InsightsPanel";

export default function InsightsPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Advanced insights
        </p>
        <h1 className="text-3xl font-semibold text-ink">Market Insights</h1>
        <p className="text-sm text-slate-600">
          Insights runs complex queries across housing, Census, and school datasets to surface
          non-obvious patterns. Discover ZIP codes with the strongest price growth in lower-income
          areas, markets where school quality outpaces home prices (potentially undervalued), and an
          affordability index ranking that shows where income can most comfortably support home
          ownership — optionally filtered by state.
        </p>
      </div>
      <InsightsPanel />
    </div>
  );
}
