import { getPool, queryRows } from "@/lib/db";
import { NextResponse } from "next/server";

type Row = {
  school_id: number;
  name: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  test_score: number | null;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ stateCode: string }> }
): Promise<NextResponse> {
  const { stateCode } = await context.params;
  const state = decodeURIComponent(stateCode).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(state)) {
    return NextResponse.json({ error: "state must be two-letter code" }, { status: 400 });
  }

  const rawLimit = new URL(request.url).searchParams.get("limit");
  const parsed = Number(rawLimit ?? "25");
  const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 25;

  const rows = await queryRows<Row>(
    `SELECT s.school_id,
            s.name,
            z.city,
            z.state,
            s.zip_code,
            ss.test_score
     FROM School s
     JOIN ZipCode z ON z.zip_code = s.zip_code
     JOIN SchoolStats ss ON ss.school_id = s.school_id
     WHERE z.state = $1
       AND ss.test_score IS NOT NULL
     ORDER BY ss.test_score DESC
     LIMIT $2`,
    [state, limit]
  );

  if (rows.length === 0 && getPool()) {
    return NextResponse.json({ error: "No schools found for state" }, { status: 404 });
  }

  return NextResponse.json({
    state,
    schools: rows,
    source: getPool() ? "database" : "mock"
  });
}
