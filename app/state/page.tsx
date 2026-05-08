import { StateDrilldownPanel } from "@/components/StateDrilldownPanel";

export default function StatePage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:py-12">
      <div className="ui-surface space-y-2 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          State explorer
        </p>
        <h1 className="text-3xl font-semibold text-ink">State Drill-Down</h1>
        <p className="text-sm text-slate-600">
          Compare state-level latest home-value distributions, then drill into top schools for
          any selected state.
        </p>
      </div>
      <StateDrilldownPanel />
    </div>
  );
}
