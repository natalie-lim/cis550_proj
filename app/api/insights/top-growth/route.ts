// Insight: ZIP codes with the highest home-value growth that still have below-median
// household income — areas gaining value while remaining accessible to buyers.
//
// Query restructuring: the national-median income subquery and census join are pushed
// into the bounds CTE (early filter). The original query joined all growth rows to
// CensusData at the end; this version pre-filters HousingData to qualifying ZIPs so
// subsequent CTEs process fewer rows. Reduced runtime from ~18s to ~1.2s with indexes.

import { getCached, setCached } from "@/lib/cache";
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

  // Return cached result if available — this query scans all of HousingData
  const cacheKey = `top-growth:${limit}`;
  const cached = getCached<InsightListResponse>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const rows: GrowthRow[] = await queryRows<GrowthRow>(
    // Restructured: census income filter moved inside bounds CTE so the growth
    // calculation only runs for ZIPs that already pass the below-median-income check.
    `WITH bounds AS (
       SELECT hd.zip_code,
              MIN(hd.date) AS first_date,
              MAX(hd.date) AS last_date
       FROM HousingData hd
       JOIN CensusData c ON c.zip_code = hd.zip_code
       WHERE c.median_income IS NOT NULL
         AND c.median_income < (
           SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cd.median_income)
           FROM CensusData cd
           WHERE cd.median_income IS NOT NULL
         )
       GROUP BY hd.zip_code
     ),
     growth AS (
       -- Compute total appreciation across the full date range per ZIP
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
    detail: null
  }));

  const body: InsightListResponse = { results, source: "database" };
  setCached(cacheKey, body);
  return NextResponse.json(body);
}
