import Link from "next/link";

export default function ZipNotFound(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">
        ZIP not found
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">
        That ZIP code is outside the scope of our data.
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        We currently support ZIP codes covered by our housing, Census, and school
        datasets. Try searching for a different ZIP code.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        Back to home
      </Link>
    </div>
  );
}
