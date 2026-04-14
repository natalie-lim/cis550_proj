"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ZipSearchForm(): React.JSX.Element {
  const router = useRouter();
  const [zip, setZip] = useState<string>("");

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed: string = zip.trim();
    if (trimmed.length === 0) {
      return;
    }
    router.push(`/zip/${encodeURIComponent(trimmed)}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center"
    >
      <label className="sr-only" htmlFor="zip-search">
        ZIP code
      </label>
      <input
        id="zip-search"
        name="zip"
        inputMode="numeric"
        pattern="[0-9]{5}(-[0-9]{4})?"
        placeholder="Search ZIP (e.g. 90210)"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-accent focus:ring-2"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
      />
      <button
        type="submit"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        View ZIP
      </button>
    </form>
  );
}
