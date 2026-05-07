import { InsightsPanel } from "@/components/InsightsPanel";

export default function InsightsPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:py-12">
      <div className="ui-surface space-y-2 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Advanced insights
        </p>
        <h1 className="text-3xl font-semibold text-ink">Market Insights</h1>
        <p className="text-sm text-slate-600">
          Three data-driven lenses to help families find the right place to move. Each tab runs a
          complex query across housing, Census, and school datasets — click any ZIP to explore its
          full detail page.
        </p>
      </div>
      <InsightsPanel />
    </div>
  );
}
