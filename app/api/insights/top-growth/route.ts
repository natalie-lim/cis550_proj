import { queryRows } from "@/lib/db";
import { getMockTopGrowth } from "@/lib/mockData";
import type { InsightListResponse, InsightRow } from "@/lib/types";
import { NextResponse } from "next/server";

type GrowthRow = {
  zip_code: string;
  city: string | null;
  state: string | null;
  growth_pct: number | null;
};

export async function GET(request: Request): Promise<NextResponse<InsightListResponse>> {
  const url: URL = new URL(request.url);
  const limitParam: string | null = url.searchParams.get("limit");
  const parsed: number = Number(limitParam ?? "10");
  const limit: number =
    Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50) : 10;

  const rows: GrowthRow[] = await queryRows<GrowthRow>(
    `WITH bounds AS (
       SELECT hd.zip_code,
              MIN(hd.date) AS first_date,
              MAX(hd.date) AS last_date
       FROM HousingData hd
       GROUP BY hd.zip_code
     ),
     growth AS (
       SELECT b.zip_code,
              ((last_row.home_value - first_row.home_value)
                / NULLIF(first_row.home_value, 0)) * 100 AS growth_pct
       FROM bounds b
       JOIN HousingData first_row
         ON first_row.zip_code = b.zip_code AND first_row.date = b.first_date
       JOIN HousingData last_row
         ON last_row.zip_code = b.zip_code AND last_row.date = b.last_date
     )
     SELECT g.zip_code AS zip_code,
            z.city AS city,
            z.state AS state,
            g.growth_pct AS growth_pct
     FROM growth g
     JOIN ZipCode z ON z.zip_code = g.zip_code
     JOIN CensusData c ON c.zip_code = g.zip_code
     WHERE c.median_income IS NOT NULL
       AND c.median_income < (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cd.median_income)
                                FROM CensusData cd
                               WHERE cd.median_income IS NOT NULL)
     ORDER BY g.growth_pct DESC NULLS LAST
     LIMIT $1`,
    [limit]
  );

  if (rows.length === 0) {
    return NextResponse.json(getMockTopGrowth(limit));
  }

  const results: InsightRow[] = rows.map((row) => ({
    zip_code: row.zip_code,
    city: row.city,
    state: row.state,
    metric_value: row.growth_pct,
    detail: "YoY-style growth for ZIPs with below-median household income"
  }));

  return NextResponse.json({ results, source: "database" });
}
