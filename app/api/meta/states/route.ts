import { queryRows } from "@/lib/db";
import { NextResponse } from "next/server";

type Row = {
  state: string;
  num_zips: number;
  num_schools: number;
};

export async function GET(): Promise<NextResponse> {
  const rows = await queryRows<Row>(
    `SELECT z.state,
            COUNT(DISTINCT z.zip_code)::int AS num_zips,
            COUNT(DISTINCT s.school_id)::int AS num_schools
     FROM ZipCode z
     LEFT JOIN School s ON s.zip_code = z.zip_code
     WHERE z.state IS NOT NULL
     GROUP BY z.state
     ORDER BY z.state`,
    []
  );
  return NextResponse.json(rows);
}
