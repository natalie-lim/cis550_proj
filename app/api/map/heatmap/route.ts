import { queryRows } from "@/lib/db";
import { NextResponse } from "next/server";

type Row = { zip_code: string; value: number | null };

export async function GET(request: Request): Promise<NextResponse> {
  const params = new URL(request.url).searchParams;
  const metric = (params.get("metric") ?? "").trim();
  const state = params.get("state")?.trim().toUpperCase() ?? null;

  const colMap: Record<string, string> = {
    home_value: "home_value",
    income: "median_income",
    rent: "median_rent",
    poverty: "poverty_rate"
  };
  const selected = colMap[metric];
  if (!selected) {
    return NextResponse.json(
      { error: "metric must be one of home_value, income, rent, poverty" },
      { status: 400 }
    );
  }

  const sql =
    selected === "home_value"
      ? `WITH latest AS (
           SELECT hd.zip_code,
                  hd.home_value,
                  ROW_NUMBER() OVER (PARTITION BY hd.zip_code ORDER BY hd.date DESC) AS rn
           FROM HousingData hd
         )
         SELECT l.zip_code, l.home_value AS value
         FROM latest l
         JOIN ZipCode z ON z.zip_code = l.zip_code
         WHERE l.rn = 1
           AND l.home_value IS NOT NULL
           AND ($1::text IS NULL OR z.state = $1)`
      : `SELECT c.zip_code, c.${selected} AS value
         FROM CensusData c
         JOIN ZipCode z ON z.zip_code = c.zip_code
         WHERE c.${selected} IS NOT NULL
           AND ($1::text IS NULL OR z.state = $1)`;

  const rows = await queryRows<Row>(sql, [state]);
  return NextResponse.json(rows);
}
