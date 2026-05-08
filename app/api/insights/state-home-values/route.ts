import { queryRows } from "@/lib/db";
import { NextResponse } from "next/server";

type Row = {
  state: string;
  num_zips: number;
  avg_home_value: number;
  min_home_value: number;
  max_home_value: number;
};

export async function GET(request: Request): Promise<NextResponse> {
  const order = new URL(request.url).searchParams.get("order")?.toLowerCase();
  const orderSql = order === "asc" ? "ASC" : "DESC";

  const rows = await queryRows<Row>(
    `WITH state_zips AS (
       SELECT z.zip_code, z.state
       FROM ZipCode z
       WHERE z.state IS NOT NULL
     ),
     latest AS (
       SELECT sz.state, h.home_value
       FROM state_zips sz
       JOIN LATERAL (
         SELECT hd.home_value
         FROM HousingData hd
         WHERE hd.zip_code = sz.zip_code
         ORDER BY hd.date DESC
         LIMIT 1
       ) h ON TRUE
     )
     SELECT l.state AS state,
            COUNT(*)::int AS num_zips,
            AVG(l.home_value)::float8 AS avg_home_value,
            MIN(l.home_value)::float8 AS min_home_value,
            MAX(l.home_value)::float8 AS max_home_value
     FROM latest l
     GROUP BY l.state
     ORDER BY avg_home_value ${orderSql}`,
    []
  );

  return NextResponse.json(rows);
}
