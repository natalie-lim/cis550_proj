// Insight: ZIP codes where school quality ranks higher than home prices within the
// same state — districts where families get more school quality per dollar spent.
//
// Uses PERCENT_RANK() window functions partitioned by state to compute relative
// price and school-score percentiles, then returns ZIPs where the school percentile
// exceeds the price percentile by more than 20 points.
//
// Existential check: results are further filtered with EXISTS to ensure each returned
// ZIP has at least one school with an above-average test score (SEDA z-score > 0),
// guaranteeing the school quality advantage is real and not just a statistical artifact.

import { getCached, setCached } from "@/lib/cache";
import { queryRows } from "@/lib/db";
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
    `WITH latest_home AS (
       -- Pick the most recent home value per ZIP using a window function
       SELECT hd.zip_code,
              hd.home_value,
              ROW_NUMBER() OVER (PARTITION BY hd.zip_code ORDER BY hd.date DESC) AS rn
       FROM HousingData hd
     ),
     zip_home AS (
       SELECT lh.zip_code, lh.home_value
       FROM latest_home lh
       WHERE lh.rn = 1
     ),
     school_avg AS (
       -- Aggregate test scores to ZIP level for percentile ranking
       SELECT s.zip_code, AVG(ss.test_score) AS avg_test
       FROM School s
       JOIN SchoolStats ss ON ss.school_id = s.school_id
       GROUP BY s.zip_code
     ),
     ranked AS (
       -- Rank each ZIP within its state by price and by school quality
       SELECT zh.zip_code,
              z.city AS city,
              z.state AS state,
              PERCENT_RANK() OVER (PARTITION BY z.state ORDER BY zh.home_value) AS price_pct,
              PERCENT_RANK() OVER (PARTITION BY z.state ORDER BY sa.avg_test)   AS school_pct
       FROM zip_home zh
       JOIN ZipCode z ON z.zip_code = zh.zip_code
       JOIN school_avg sa ON sa.zip_code = zh.zip_code
     )
     SELECT r.zip_code AS zip_code,
            r.city AS city,
            r.state AS state,
            r.price_pct AS price_score,
            r.school_pct AS school_score
     FROM ranked r
     WHERE r.school_pct - r.price_pct > 0.2
       -- Existential check: only include ZIPs that actually have at least one
       -- above-average school (z-score > 0), confirming the school advantage is real
       AND EXISTS (
         SELECT 1
         FROM School s2
         JOIN SchoolStats ss2 ON ss2.school_id = s2.school_id
         WHERE s2.zip_code = r.zip_code
           AND ss2.test_score > 0
       )
     ORDER BY (r.school_pct - r.price_pct) DESC
     LIMIT $1`,
    [limit]
  );

  if (rows.length === 0) {
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
