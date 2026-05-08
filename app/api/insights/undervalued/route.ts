// ZIPs where in-state school-quality percentile beats price percentile by >20.
// Includes both existential and universal checks at the school level.

import { getCached, setCached } from "@/lib/cache";
import { getPool, queryRows } from "@/lib/db";
import { getMockUndervalued } from "@/lib/mockData";
import type { InsightListResponse, InsightRow } from "@/lib/types";
import { NextResponse } from "next/server";

type ValueRow = {
  zip_code: string;
  city: string | null;
  state: string | null;
  price_score: number | null;
  school_score: number | null;
};

export async function GET(request: Request): Promise<NextResponse<InsightListResponse>> {
  const url: URL = new URL(request.url);
  const limitParam: string | null = url.searchParams.get("limit");
  const parsed: number = Number(limitParam ?? "10");
  const limit: number =
    Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50) : 10;

  const cacheKey = `undervalued:${limit}`;
  const cached = getCached<InsightListResponse>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const rows: ValueRow[] = await queryRows<ValueRow>(
    `WITH school_avg AS (
      -- ZIP-level school score with non-null, positive test-score constraint.
      SELECT s.zip_code, AVG(ss.test_score) AS avg_test
       FROM School s
      LEFT JOIN SchoolStats ss ON ss.school_id = s.school_id
       GROUP BY s.zip_code
      HAVING COUNT(*) >= 1
         AND COUNT(*) = COUNT(*) FILTER (
           WHERE ss.test_score IS NOT NULL AND ss.test_score > 0
         )
     ),
     latest_home AS (
      -- Latest home value per ZIP.
       SELECT sa.zip_code, h.home_value
       FROM school_avg sa
       JOIN LATERAL (
         SELECT hd.home_value
         FROM HousingData hd
         WHERE hd.zip_code = sa.zip_code
         ORDER BY hd.date DESC
         LIMIT 1
       ) h ON TRUE
     ),
     ranked AS (
      -- Rank each ZIP within state by price and school score.
       SELECT sa.zip_code,
              z.city AS city,
              z.state AS state,
              PERCENT_RANK() OVER (PARTITION BY z.state ORDER BY lh.home_value) AS price_pct,
              PERCENT_RANK() OVER (PARTITION BY z.state ORDER BY sa.avg_test)   AS school_pct
       FROM school_avg sa
       JOIN latest_home lh ON lh.zip_code = sa.zip_code
       JOIN ZipCode z ON z.zip_code = sa.zip_code
     )
     SELECT r.zip_code AS zip_code,
            r.city AS city,
            r.state AS state,
            r.price_pct AS price_score,
            r.school_pct AS school_score
     FROM ranked r
    WHERE r.school_pct - r.price_pct > 0.2
     ORDER BY (r.school_pct - r.price_pct) DESC
     LIMIT $1`,
    [limit]
  );

  if (rows.length === 0) {
    if (getPool()) {
      return NextResponse.json({ results: [], source: "database" });
    }
    return NextResponse.json(getMockUndervalued(limit));
  }

  const results: InsightRow[] = rows.map((row) => ({
    zip_code: row.zip_code,
    city: row.city,
    state: row.state,
    metric_value:
      row.school_score != null && row.price_score != null
        ? row.school_score - row.price_score
        : null,
    detail: null
  }));

  const body: InsightListResponse = { results, source: "database" };
  setCached(cacheKey, body);
  return NextResponse.json(body);
}
