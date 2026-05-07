"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CompareSearchFormProps = {
  defaultZip1?: string;
  defaultZip2?: string;
};

export function CompareSearchForm({
  defaultZip1 = "",
  defaultZip2 = ""
}: CompareSearchFormProps): React.JSX.Element {
  const router = useRouter();
  const [zip1, setZip1] = useState(defaultZip1);
  const [zip2, setZip2] = useState(defaultZip2);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    const z1 = zip1.trim();
    const z2 = zip2.trim();
    if (z1 && z2) {
      router.push(`/compare?zips=${encodeURIComponent(`${z1},${z2}`)}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ui-surface flex flex-col items-end gap-3 p-3 sm:flex-row"
    >
      <div className="flex-1">
        <label
          htmlFor="zip1"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          ZIP Code 1
        </label>
        <input
          id="zip1"
          type="text"
          value={zip1}
          onChange={(e) => setZip1(e.target.value)}
          placeholder="e.g. 90210"
          maxLength={5}
          pattern="\d{5}"
          className="ui-input"
        />
      </div>
      <div className="flex-1">
        <label
          htmlFor="zip2"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          ZIP Code 2
        </label>
        <input
          id="zip2"
          type="text"
          value={zip2}
          onChange={(e) => setZip2(e.target.value)}
          placeholder="e.g. 10001"
          maxLength={5}
          pattern="\d{5}"
          className="ui-input"
        />
      </div>
      <button
        type="submit"
        className="ui-button-primary px-6"
      >
        Compare
      </button>
    </form>
  );
}
