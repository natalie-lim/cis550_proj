import { queryRows } from "@/lib/db";
import { NextResponse } from "next/server";

type Row = {
  zip_code: string;
  current_home_value: number | null;
  median_income: number | null;
  price_to_income: number | null;
  avg_school_score: number | null;
  num_schools: number;
  poverty_rate: number | null;
  commute_time: number | null;
};

export async function GET(request: Request): Promise<NextResponse> {
  const rawLimit = new URL(request.url).searchParams.get("limit");
  const parsed = Number(rawLimit ?? "30");
  const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 30;

  const rows = await queryRows<Row>(
    `WITH latest_home AS (
       SELECT hd.zip_code,
              hd.home_value,
              ROW_NUMBER() OVER (PARTITION BY hd.zip_code ORDER BY hd.date DESC) AS rn
       FROM HousingData hd
     ),
     zip_metrics AS (
       SELECT s.zip_code,
              AVG(ss.test_score) AS avg_score,
              COUNT(*)::int AS num_schools
       FROM School s
       JOIN SchoolStats ss ON ss.school_id = s.school_id
       WHERE ss.test_score IS NOT NULL
       GROUP BY s.zip_code
       HAVING COUNT(*) >= 3
     ),
     thresholds AS (
       SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY avg_score) AS median_score
       FROM zip_metrics
     ),
     pti_threshold AS (
       SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (
         ORDER BY (lh.home_value / NULLIF(c.median_income, 0))
       ) AS median_pti
       FROM latest_home lh
       FROM CensusData c
       WHERE lh.rn = 1 AND c.zip_code = lh.zip_code AND lh.home_value IS NOT NULL AND c.median_income > 0
     )
     SELECT zm.zip_code,
            lh.home_value AS current_home_value,
            c.median_income,
            (lh.home_value / NULLIF(c.median_income, 0)) AS price_to_income,
            zm.avg_score AS avg_school_score,
            zm.num_schools,
            c.poverty_rate,
            c.commute_time
     FROM zip_metrics zm
     JOIN CensusData c ON c.zip_code = zm.zip_code
     JOIN latest_home lh ON lh.zip_code = zm.zip_code AND lh.rn = 1
     CROSS JOIN thresholds t
     CROSS JOIN pti_threshold p
     WHERE zm.avg_score > t.median_score
       AND (lh.home_value / NULLIF(c.median_income, 0)) < p.median_pti
       AND lh.home_value IS NOT NULL
       AND c.median_income > 0
     ORDER BY (zm.avg_score - (lh.home_value / NULLIF(c.median_income, 0)) / 10.0) DESC
     LIMIT $1`,
    [limit]
  );

  return NextResponse.json(rows);
}
