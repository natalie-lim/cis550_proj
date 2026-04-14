import { queryRows } from "@/lib/db";
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
  const state: string | null = stateParam?.trim().toUpperCase() ?? null;

  const rows: AffordRow[] = await queryRows<AffordRow>(
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
     ORDER BY ratio ASC NULLS LAST
     LIMIT $2`,
    [state, limit]
  );

  if (rows.length === 0) {
    return NextResponse.json(getMockAffordability(state, limit));
  }

  const results: InsightRow[] = rows.map((row) => ({
    zip_code: row.zip_code,
    city: row.city,
    state: row.state,
    metric_value: row.ratio,
    detail: "Latest modeled home value divided by median household income"
  }));

  return NextResponse.json({ results, source: "database" });
}
