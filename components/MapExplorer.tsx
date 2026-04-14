"use client";

type MapExplorerProps = {
  apiKey: string | undefined;
};

export function MapExplorer(props: MapExplorerProps): React.JSX.Element {
  const key: string | undefined = props.apiKey;

  if (!key) {
    return (
      <div className="flex h-[420px] flex-col justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 text-center text-sm text-slate-600">
        <p className="text-base font-semibold text-slate-900">
          Interactive map preview
        </p>
        <p>
          Set <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
          in <code className="rounded bg-slate-100 px-1">.env.local</code> to enable the embedded
          Google Map (Embed API) for Milestone heatmaps.
        </p>
        <p className="text-xs text-slate-500">
          Until then, use ZIP search and the detail pages to explore seeded metrics.
        </p>
      </div>
    );
  }

  const embedUrl: string = `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(
    key
  )}&center=39.8283,-98.5795&zoom=4&maptype=roadmap`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <iframe
        title="United States overview map"
        className="h-[420px] w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
      />
    </div>
  );
}
