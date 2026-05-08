// ZIP affordability ranking by price-to-income ratio.

import { getCached, setCached } from "@/lib/cache";
import { getPool, queryRows } from "@/lib/db";
import { getMockAffordability } from "@/lib/mockData";
import type { InsightListResponse, InsightRow } from "@/lib/types";
import { NextResponse } from "next/server";

type AffordRow = {
  zip_code: string;
  city: string | null;
  state: string | null;
  ratio: number | null;
};

export async function GET(request: Request): Promise<NextResponse<InsightListResponse>> {
  const url: URL = new URL(request.url);
  const limitParam: string | null = url.searchParams.get("limit");
  const stateParam: string | null = url.searchParams.get("state");
  const parsed: number = Number(limitParam ?? "10");
  const limit: number =
    Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50) : 10;
  // Normalize state to uppercase 2-letter code; null means no filter.
  const state: string | null = stateParam?.trim().toUpperCase() ?? null;

  const cacheKey = `affordability:${limit}:${state ?? "all"}`;
  const cached = getCached<InsightListResponse>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const rows: AffordRow[] = await queryRows<AffordRow>(
    // Use latest home value per ZIP before joining with census metrics.
    `WITH latest_home AS (
       SELECT hd.zip_code,
              hd.home_value,
              ROW_NUMBER() OVER (PARTITION BY hd.zip_code ORDER BY hd.date DESC) AS rn
       FROM HousingData hd
     ),
     zip_home AS (
       SELECT lh.zip_code, lh.home_value
       FROM latest_home lh
       WHERE lh.rn = 1
     )
     SELECT zh.zip_code AS zip_code,
            z.city AS city,
            z.state AS state,
            (zh.home_value / NULLIF(c.median_income, 0)) AS ratio
     FROM zip_home zh
     JOIN ZipCode z ON z.zip_code = zh.zip_code
     JOIN CensusData c ON c.zip_code = zh.zip_code
     WHERE ($1::varchar IS NULL OR z.state = $1)
       AND c.median_income > 0
       AND zh.home_value > 0
     ORDER BY ratio ASC NULLS LAST
     LIMIT $2`,
    [state, limit]
  );

  if (rows.length === 0) {
    if (getPool()) {
      return NextResponse.json({ results: [], source: "database" });
    }
    return NextResponse.json(getMockAffordability(state, limit));
  }

  const results: InsightRow[] = rows.map((row) => ({
    zip_code: row.zip_code,
    city: row.city,
    state: row.state,
    metric_value: row.ratio,
    detail: null
  }));

  const body: InsightListResponse = { results, source: "database" };
  setCached(cacheKey, body);
  return NextResponse.json(body);
}
