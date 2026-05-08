import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

vi.mock("next/link", () => ({
  default: ({
    href,
    children
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement("a", { href }, children)
}));

import { InsightsPanel } from "@/components/InsightsPanel";

describe("InsightsPanel", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("loads growth tab by default and renders results", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        source: "database",
        results: [
          {
            zip_code: "07090",
            city: "Westfield",
            state: "NJ",
            metric_value: 3.2,
            detail: null
          }
        ]
      })
    });

    render(<InsightsPanel />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/insights/top-growth?limit=50");
    });
    expect(await screen.findByText("07090")).toBeInTheDocument();
  });

  it("switches to affordability tab and applies state filter", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ source: "database", results: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ source: "database", results: [] })
      });

    render(<InsightsPanel />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Best Price-to-Income Value" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/insights/affordability?limit=50")
    );

    fireEvent.change(screen.getByPlaceholderText("CA"), {
      target: { value: "nj" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/insights/affordability?limit=50&state=NJ"
      )
    );
  });
});
