import { queryRows } from "@/lib/db";
import { NextResponse } from "next/server";

type Row = {
  school_id: number;
  name: string;
  zip_code: string | null;
  city: string | null;
  state: string | null;
  school_type: string | null;
  grade_range: string | null;
  test_score: number | null;
  student_teacher_ratio: number | null;
  enrollment: number | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ schoolId: string }> }
): Promise<NextResponse> {
  const { schoolId } = await context.params;
  const id = Number(decodeURIComponent(schoolId).trim());
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "schoolId must be a positive integer" }, { status: 400 });
  }

  const rows = await queryRows<Row>(
    `SELECT s.school_id, s.name, s.zip_code, z.city, z.state,
            s.school_type, s.grade_range,
            ss.test_score, ss.student_teacher_ratio, ss.enrollment
     FROM School s
     LEFT JOIN ZipCode z ON z.zip_code = s.zip_code
     LEFT JOIN SchoolStats ss ON ss.school_id = s.school_id
     WHERE s.school_id = $1`,
    [id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
