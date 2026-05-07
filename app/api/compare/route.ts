// Side-by-side comparison for up to 5 ZIP codes. The metrics query uses a CTE with
// ROW_NUMBER() window functions to find each ZIP's first and last home values in a
// single pass, then computes growth, affordability index, and average school score.
// Returns an empty zips array (not mock data) when the DB is connected but ZIPs are
// not found, so the frontend can show a proper "out of scope" error.

import { getPool, queryRows } from "@/lib/db";
import { getMockCompare } from "@/lib/mockData";
import type {
  CensusRow,
  CompareResponse,
  CompareZipMetric,
  ZipSummary
} from "@/lib/types";
import { NextResponse } from "next/server";

type ZipRow = ZipSummary;

type CensusDbRow = CensusRow & { zip_code: string };

type MetricRow = {
  zip_code: string;
  latest_home_value: number | null;
  first_home_value: number | null;
  avg_test_score: number | null;
};

export async function GET(request: Request): Promise<NextResponse<CompareResponse>> {
  const url: URL = new URL(request.url);
  const raw: string | null = url.searchParams.get("zips");
  const zips: string[] = (raw ?? "")
    .split(",")
    .map((z) => z.trim())
    .filter((z) => z.length > 0)
    .slice(0, 5);

  if (zips.length === 0) {
    return NextResponse.json({ zips: [], source: "mock" });
  }

  const zipRows: ZipRow[] = await queryRows<ZipRow>(
    `SELECT zc.zip_code AS zip_code, zc.city AS city, zc.state AS state
     FROM ZipCode zc
     WHERE zc.zip_code = ANY($1::varchar[])`,
    [zips]
  );

  if (zipRows.length === 0) {
    if (!getPool()) return NextResponse.json(getMockCompare(zips));
    return NextResponse.json({ zips: [], source: "database" } as CompareResponse);
  }

  const censusRows: CensusDbRow[] = await queryRows<CensusDbRow>(
    `SELECT cd.zip_code AS zip_code,
            cd.median_income AS median_income,
            cd.median_rent AS median_rent,
            cd.commute_time AS commute_time,
            cd.unemployment_rate AS unemployment_rate,
            cd.poverty_rate AS poverty_rate
     FROM CensusData cd
     WHERE cd.zip_code = ANY($1::varchar[])`,
    [zips]
  );

  const metricRows: MetricRow[] = await queryRows<MetricRow>(
    `WITH ordered AS (
       SELECT hd.zip_code,
              hd.date,
              hd.home_value,
              ROW_NUMBER() OVER (PARTITION BY hd.zip_code ORDER BY hd.date ASC) AS rn_asc,
              ROW_NUMBER() OVER (PARTITION BY hd.zip_code ORDER BY hd.date DESC) AS rn_desc
       FROM HousingData hd
       WHERE hd.zip_code = ANY($1::varchar[])
     ),
     agg AS (
       SELECT o.zip_code,
              MAX(CASE WHEN o.rn_desc = 1 THEN o.home_value END) AS latest_home_value,
              MAX(CASE WHEN o.rn_asc = 1 THEN o.home_value END) AS first_home_value
       FROM ordered o
       GROUP BY o.zip_code
     ),
     schools AS (
       SELECT s.zip_code,
              AVG(ss.test_score) AS avg_test_score
       FROM School s
       LEFT JOIN SchoolStats ss ON ss.school_id = s.school_id
       WHERE s.zip_code = ANY($1::varchar[])
       GROUP BY s.zip_code
     )
     SELECT a.zip_code,
            a.latest_home_value,
            a.first_home_value,
            sch.avg_test_score
     FROM agg a
     LEFT JOIN schools sch ON sch.zip_code = a.zip_code`,
    [zips]
  );

  const censusByZip: Map<string, CensusRow> = new Map(
    censusRows.map((row) => [
      row.zip_code,
      {
        median_income: row.median_income,
        median_rent: row.median_rent,
        commute_time: row.commute_time,
        unemployment_rate: row.unemployment_rate ?? null,
        poverty_rate: row.poverty_rate ?? null
      }
    ])
  );

  const metricsByZip: Map<string, MetricRow> = new Map(
    metricRows.map((row) => [row.zip_code, row])
  );

  const metrics: CompareZipMetric[] = zipRows.map((zipRow) => {
    const metricsForZip: MetricRow | undefined = metricsByZip.get(
      zipRow.zip_code
    );
    const latest: number | null | undefined = metricsForZip?.latest_home_value;
    const first: number | null | undefined = metricsForZip?.first_home_value;
    let yoy: number | null = null;
    if (latest != null && first != null && first > 0) {
      yoy = ((latest - first) / first) * 100;
    }
    const census: CensusRow | null =
      censusByZip.get(zipRow.zip_code) ?? null;
    const income: number | null = census?.median_income ?? null;
    const affordability: number | null =
      income && latest != null ? latest / income : null;

    return {
      zip: zipRow,
      census,
      latest_home_value: latest ?? null,
      yoy_growth_pct: yoy,
      affordability_index: affordability,
      avg_school_test_score: metricsForZip?.avg_test_score ?? null
    };
  });

  const body: CompareResponse = { zips: metrics, source: "database" };
  return NextResponse.json(body);
}
