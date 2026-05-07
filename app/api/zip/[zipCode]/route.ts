// Fetches all data for a single ZIP code: location, Census snapshot, housing time
// series, and nearby schools with test scores. Returns 404 when the ZIP is not in the
// database; falls back to mock data only when no DB connection is present (dev mode).

import { getPool, queryRows } from "@/lib/db";
import { getMockZipDetail } from "@/lib/mockData";
import type {
  CensusRow,
  HousingPoint,
  SchoolRow,
  ZipDetailResponse,
  ZipSummary
} from "@/lib/types";
import { NextResponse } from "next/server";

type ZipRow = ZipSummary;

type CensusDbRow = CensusRow & { zip_code: string };

type HousingDbRow = HousingPoint & { zip_code: string };

type SchoolDbRow = {
  school_id: number;
  name: string;
  test_score: number | null;
  school_type: string | null;
  grade_range: string | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ zipCode: string }> }
): Promise<NextResponse<ZipDetailResponse>> {
  const { zipCode } = await context.params;
  const normalized: string = decodeURIComponent(zipCode).trim();

  const zipRows: ZipRow[] = await queryRows<ZipRow>(
    `SELECT zc.zip_code AS zip_code, zc.city AS city, zc.state AS state
     FROM ZipCode zc
     WHERE zc.zip_code = $1`,
    [normalized]
  );

  if (zipRows.length === 0) {
    // No DB connection — fall back to mock for dev; DB connected but ZIP missing — 404
    if (!getPool()) return NextResponse.json(getMockZipDetail(normalized));
    return new NextResponse(null, { status: 404 }) as NextResponse<ZipDetailResponse>;
  }

  const censusRows: CensusDbRow[] = await queryRows<CensusDbRow>(
    `SELECT cd.zip_code AS zip_code,
            cd.median_income AS median_income,
            cd.median_rent AS median_rent,
            cd.commute_time AS commute_time,
            cd.unemployment_rate AS unemployment_rate,
            cd.poverty_rate AS poverty_rate
     FROM CensusData cd
     WHERE cd.zip_code = $1`,
    [normalized]
  );

  const housingRows: HousingDbRow[] = await queryRows<HousingDbRow>(
    `SELECT hd.zip_code AS zip_code, hd.date AS date, hd.home_value AS home_value
     FROM HousingData hd
     WHERE hd.zip_code = $1
       AND hd.date = (date_trunc('month', hd.date) + INTERVAL '1 month - 1 day')::date
     ORDER BY hd.date ASC`,
    [normalized]
  );

  const schoolRows: SchoolDbRow[] = await queryRows<SchoolDbRow>(
    `SELECT s.school_id AS school_id,
            s.name AS name,
            ss.test_score AS test_score,
            s.school_type AS school_type,
            s.grade_range AS grade_range
     FROM School s
     LEFT JOIN SchoolStats ss ON ss.school_id = s.school_id
     WHERE s.zip_code = $1
     ORDER BY s.name ASC`,
    [normalized]
  );

  const zip: ZipSummary = zipRows[0]!;
  const censusRow: CensusDbRow | undefined = censusRows[0];
  const census: CensusRow | null = censusRow
    ? {
        median_income: censusRow.median_income,
        median_rent: censusRow.median_rent,
        commute_time: censusRow.commute_time,
        unemployment_rate: censusRow.unemployment_rate,
        poverty_rate: censusRow.poverty_rate
      }
    : null;

  const housingSeries: HousingPoint[] = housingRows.map((row) => ({
    date: row.date,
    home_value: row.home_value
  }));

  const schools: SchoolRow[] = schoolRows.map((row) => ({
    school_id: row.school_id,
    name: row.name,
    test_score: row.test_score,
    school_type: row.school_type,
    grade_range: row.grade_range
  }));

  const body: ZipDetailResponse = {
    zip,
    census,
    housingSeries,
    schools,
    source: "database"
  };

  return NextResponse.json(body);
}
