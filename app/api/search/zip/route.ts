import { queryRows } from "@/lib/db";
import { NextResponse } from "next/server";

type Row = {
  zip_code: string;
  city: string | null;
  state: string | null;
};

export async function GET(request: Request): Promise<NextResponse> {
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") ?? "").trim();
  const parsed = Number(params.get("limit") ?? "10");
  const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 25) : 10;

  if (q.length < 2) {
    return NextResponse.json({ error: "q must be at least 2 characters" }, { status: 400 });
  }

  const rows = await queryRows<Row>(
    `SELECT z.zip_code, z.city, z.state
     FROM ZipCode z
     WHERE z.zip_code LIKE ($1 || '%')
        OR COALESCE(z.city, '') ILIKE ('%' || $1 || '%')
     ORDER BY z.zip_code
     LIMIT $2`,
    [q, limit]
  );

  return NextResponse.json(
    rows.map((r) => ({
      zip_code: r.zip_code,
      name: [r.city, r.state].filter(Boolean).join(", ")
    }))
  );
}
