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

  const rows: ValueRow[] = await queryRows<ValueRow>(
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
     ),
     school_avg AS (
       SELECT s.zip_code, AVG(ss.test_score) AS avg_test
       FROM School s
       JOIN SchoolStats ss ON ss.school_id = s.school_id
       GROUP BY s.zip_code
     ),
     ranked AS (
       SELECT zh.zip_code,
              z.city AS city,
              z.state AS state,
              PERCENT_RANK() OVER (PARTITION BY z.state ORDER BY zh.home_value) AS price_pct,
              PERCENT_RANK() OVER (PARTITION BY z.state ORDER BY sa.avg_test) AS school_pct
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
    detail: "State-level percentile gap: school quality vs home price"
  }));

  return NextResponse.json({ results, source: "database" });
}
