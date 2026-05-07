import { queryRows } from "@/lib/db";
import { getMockStateZips } from "@/lib/mockData";
import type { StateZipListResponse, StateZipSnippet } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ stateCode: string }> }
): Promise<NextResponse<StateZipListResponse | { error: string }>> {
  const { stateCode } = await context.params;
  const normalized: string = decodeURIComponent(stateCode).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return NextResponse.json(
      { error: "state must be a two-letter US state code" },
      { status: 400 }
    );
  }

  const url: URL = new URL(request.url);
  const limitParam: string | null = url.searchParams.get("limit");
  const parsed: number = Number(limitParam ?? "50");
  const limit: number =
    Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : 50;

  const rows: StateZipSnippet[] = await queryRows<StateZipSnippet>(
    `SELECT zc.zip_code AS zip_code,
            zc.city AS city,
            c.median_income AS median_income
     FROM ZipCode zc
     LEFT JOIN CensusData c ON c.zip_code = zc.zip_code
     WHERE UPPER(TRIM(zc.state)) = $1
     ORDER BY zc.zip_code
     LIMIT $2`,
    [normalized, limit]
  );

  if (rows.length === 0) {
    const fallback: readonly StateZipSnippet[] = getMockStateZips(normalized);
    return NextResponse.json({
      state: normalized,
      zips: [...fallback].slice(0, limit),
      source: "mock"
    });
  }

  return NextResponse.json({
    state: normalized,
    zips: rows,
    source: "database"
  });
}
