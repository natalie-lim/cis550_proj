"use client";

import type { HousingPoint } from "@/lib/types";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type HousingTrendChartProps = {
  data: ReadonlyArray<HousingPoint>;
};

export function HousingTrendChart(
  props: HousingTrendChartProps
): React.JSX.Element {
  const chartData = props.data.map((point) => ({
    month: point.date,
    value: point.home_value ?? 0
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis
            tickFormatter={(v: number) =>
              new Intl.NumberFormat("en-US", {
                notation: "compact",
                maximumFractionDigits: 1
              }).format(v)
            }
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
          />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0
              }).format(value)
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Home value"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
