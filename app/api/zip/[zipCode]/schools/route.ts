import { getPool, queryRows } from "@/lib/db";
import { NextResponse } from "next/server";

type Row = {
  school_id: number;
  name: string;
  school_type: string | null;
  grade_range: string | null;
  test_score: number | null;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ zipCode: string }> }
): Promise<NextResponse> {
  const { zipCode } = await context.params;
  const normalized = decodeURIComponent(zipCode).trim();
  if (!/^\d{5}$/.test(normalized)) {
    return NextResponse.json(
      { error: "zip_code must be exactly 5 digits" },
      { status: 400 }
    );
  }

  const level = new URL(request.url).searchParams.get("level")?.trim();
  const levelNormalized = level ? level.toUpperCase() : null;

  const rows = await queryRows<Row>(
    `SELECT s.school_id, s.name, s.school_type, s.grade_range, ss.test_score
     FROM School s
     LEFT JOIN SchoolStats ss ON ss.school_id = s.school_id
     WHERE s.zip_code = $1
       AND (
         $2::text IS NULL OR
         ($2 = 'ELEMENTARY' AND (
            s.grade_range ILIKE 'PK-%' OR s.grade_range ILIKE 'K-%' OR s.grade_range ILIKE '%-5'
         )) OR
         ($2 = 'MIDDLE' AND (
            s.grade_range ILIKE '5-%' OR s.grade_range ILIKE '6-%' OR s.grade_range ILIKE '7-%' OR s.grade_range ILIKE '%-8'
         )) OR
         ($2 = 'HIGH' AND (
            s.grade_range ILIKE '9-%' OR s.grade_range ILIKE '10-%' OR s.grade_range ILIKE '11-%' OR s.grade_range ILIKE '%-12'
         ))
       )
     ORDER BY s.name`,
    [normalized, levelNormalized]
  );

  if (rows.length === 0 && getPool()) {
    return NextResponse.json({ error: "No schools found for ZIP" }, { status: 404 });
  }

  return NextResponse.json({
    zip_code: normalized,
    schools: rows,
    source: getPool() ? "database" : "mock"
  });
}
