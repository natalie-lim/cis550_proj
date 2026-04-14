import { InsightsPanel } from "@/components/InsightsPanel";

export default function InsightsPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Advanced insights
        </p>
        <h1 className="text-3xl font-semibold text-ink">Query lab</h1>
        <p className="text-sm text-slate-600">
          Each button calls a dedicated API route that mirrors the complex analytics described in
          Milestone 2 (growth filters, mismatch detection, affordability index). When the database
          is empty or unreachable, the handlers fall back to structured mock payloads so the UI
          still tells a coherent story during early integration.
        </p>
      </div>
      <InsightsPanel />
    </div>
  );
}
