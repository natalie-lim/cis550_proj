"""
Backfill SchoolStats from public NCES school directory data.

Expected CSV columns (case-insensitive aliases supported):
  - SCH_NAME (or school_name)
  - LZIP (or zip_code)
  - STUTERATIO (or student_teacher_ratio)
  - MEMBER (or enrollment)

Usage:
  DATABASE_URL=postgresql://... python3 db/backfill_schoolstats_nces_public.py
  DATABASE_URL=postgresql://... NCES_CSV=/path/nces_cleaned.csv python3 db/backfill_schoolstats_nces_public.py
"""

import csv
import os
import sys

import psycopg2
from psycopg2.extras import execute_values


def to_float(value):
    try:
        return float(value) if value not in (None, "", "nan", "NA", "N/A") else None
    except (TypeError, ValueError):
        return None


def to_int(value):
    try:
        return int(float(value)) if value not in (None, "", "nan", "NA", "N/A") else None
    except (TypeError, ValueError):
        return None


def norm_zip(value: str) -> str:
    return str(value or "").strip().zfill(5)[:5]


def get_first(row: dict[str, str], keys: list[str]) -> str:
    for key in keys:
        if key in row and row[key] not in (None, ""):
            return str(row[key])
    return ""


def main() -> int:
    database_url = os.environ.get("DATABASE_URL")
    csv_path = os.environ.get("NCES_CSV", os.path.expanduser("~/Downloads/cleaned/nces_cleaned.csv"))

    if not database_url:
        print("Error: DATABASE_URL is not set")
        return 1
    if not os.path.exists(csv_path):
        print(f"Error: NCES file not found at {csv_path}")
        return 1

    conn = psycopg2.connect(database_url, connect_timeout=10)
    cur = conn.cursor()

    cur.execute("SELECT school_id, name, zip_code FROM School")
    school_lookup = {
        ((name or "").strip().lower(), (zip_code or "").strip()): school_id
        for school_id, name, zip_code in cur.fetchall()
    }

    upserts: list[tuple[int, None, float | None, int | None]] = []
    seen: set[int] = set()
    with open(csv_path, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for raw_row in reader:
            row = {str(k).strip().upper(): v for k, v in raw_row.items()}
            name = get_first(row, ["SCH_NAME", "SCHOOL_NAME"]).strip()
            zip_code = norm_zip(get_first(row, ["LZIP", "ZIP_CODE"]))
            if not name or not zip_code:
                continue
            school_id = school_lookup.get((name.lower(), zip_code))
            if school_id is None or school_id in seen:
                continue
            ratio = to_float(get_first(row, ["STUTERATIO", "STUDENT_TEACHER_RATIO"]))
            enrollment = to_int(get_first(row, ["MEMBER", "ENROLLMENT"]))
            if ratio is not None and ratio <= 0:
                ratio = None
            if enrollment is not None and enrollment <= 0:
                enrollment = None
            if ratio is None and enrollment is None:
                continue
            seen.add(school_id)
            upserts.append((school_id, None, ratio, enrollment))

    if upserts:
        execute_values(
            cur,
            """INSERT INTO SchoolStats (school_id, test_score, student_teacher_ratio, enrollment)
               VALUES %s
               ON CONFLICT (school_id) DO UPDATE SET
                 student_teacher_ratio = COALESCE(EXCLUDED.student_teacher_ratio, SchoolStats.student_teacher_ratio),
                 enrollment = COALESCE(EXCLUDED.enrollment, SchoolStats.enrollment)""",
            upserts,
        )
        conn.commit()

    print(f"Upserted NCES stats for {len(upserts)} schools")
    cur.close()
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
