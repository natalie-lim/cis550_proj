import { getPool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const pool = getPool();
  if (!pool) {
    return NextResponse.json({
      ok: true,
      database: "not_configured"
    });
  }
  try {
    await pool.query("SELECT 1 AS ok");
    return NextResponse.json({ ok: true, database: "connected" });
  } catch {
    return NextResponse.json(
      { ok: false, database: "error" },
      { status: 500 }
    );
  }
}
