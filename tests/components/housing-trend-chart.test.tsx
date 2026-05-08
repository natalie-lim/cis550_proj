import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "chart-container" }, children),
  LineChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  CartesianGrid: () => React.createElement("div"),
  XAxis: () => React.createElement("div"),
  YAxis: () => React.createElement("div"),
  Tooltip: () => React.createElement("div"),
  Line: () => React.createElement("div", { "data-testid": "trend-line" })
}));

import { HousingTrendChart } from "@/components/HousingTrendChart";

describe("HousingTrendChart", () => {
  it("shows empty state when fewer than two points", () => {
    render(
      <HousingTrendChart
        data={[
          { date: "2024-01-01", home_value: 500000 },
          { date: "2024-02-01", home_value: null }
        ]}
      />
    );
    expect(
      screen.getByText("Not enough housing data to plot a trend yet.")
    ).toBeInTheDocument();
  });

  it("renders chart for at least two valid points", () => {
    render(
      <HousingTrendChart
        data={[
          { date: "2024-01-01", home_value: 500000 },
          { date: "2024-02-01", home_value: 520000 }
        ]}
      />
    );
    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
    expect(screen.getByTestId("trend-line")).toBeInTheDocument();
  });
});
