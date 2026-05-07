"""
Uploads cleaned CSVs to AWS RDS PostgreSQL.

Load order (respects FK constraints):
  1. ZipCode      <- ACS zip codes + NCES city/state lookup
  2. CensusData   <- ACS (median_income, median_rent, commute_time)
  3. HousingData  <- Zillow city-level data, mapped to zips via NCES
  4. School       <- NCES schools (filtered to valid zip codes)
  5. SchoolStats  <- SEDA test scores, matched to NCES schools by name+state

Usage:
  DATABASE_URL=postgresql://user:pass@host:5432/dbname python3.11 db/upload.py
  DATA_DIR=/path/to/csvs python3.11 db/upload.py   (default: ~/Downloads/cleaned)
"""

import csv
import os
import sys
import psycopg2
from psycopg2.extras import execute_values

# ── Config ────────────────────────────────────────────────────────────────────
DATA_DIR = os.environ.get("DATA_DIR", os.path.expanduser("~/Downloads/cleaned"))

database_url = os.environ.get("DATABASE_URL")
if not database_url:
    print("Error: DATABASE_URL environment variable is not set.")
    print("  export DATABASE_URL=postgresql://user:pass@host:5432/dbname")
    sys.exit(1)

conn = psycopg2.connect(database_url, connect_timeout=10)
cur = conn.cursor()


# ── Helpers ───────────────────────────────────────────────────────────────────
def to_float(v):
    try:
        return float(v) if v not in (None, "", "nan", "NA", "N/A") else None
    except (ValueError, TypeError):
        return None


def to_int(v):
    try:
        return int(float(v)) if v not in (None, "", "nan", "NA", "N/A") else None
    except (ValueError, TypeError):
        return None


def norm_zip(z):
    return str(z).strip().zfill(5)[:5]


# ── Step 1: ZipCode ───────────────────────────────────────────────────────────
print("Step 1: Loading ZipCode...")

# Build zip -> (city, state) from NCES (best city/state lookup available)
zip_to_city: dict[str, tuple[str, str]] = {}
with open(f"{DATA_DIR}/nces_cleaned.csv", encoding="utf-8", errors="replace") as f:
    for row in csv.DictReader(f):
        zp = norm_zip(row.get("LZIP", ""))
        city = (row.get("LCITY") or "").strip()
        state = (row.get("LSTATE") or "").strip()
        if zp and city and state and zp not in zip_to_city:
            zip_to_city[zp] = (city, state)

# Collect zip codes from ACS (primary source of zip universe)
zip_rows: list[tuple] = []
seen_zips: set[str] = set()
with open(f"{DATA_DIR}/acs_cleaned.csv", encoding="utf-8", errors="replace") as f:
    for row in csv.DictReader(f):
        zp = norm_zip(row.get("zip_code", ""))
        if not zp or zp in seen_zips:
            continue
        seen_zips.add(zp)
        city, state = zip_to_city.get(zp, (None, None))
        zip_rows.append((zp, city, state))

execute_values(
    cur,
    "INSERT INTO ZipCode (zip_code, city, state) VALUES %s ON CONFLICT DO NOTHING",
    zip_rows,
)
conn.commit()
valid_zips = {r[0] for r in zip_rows}
print(f"  Inserted {len(zip_rows)} zip codes")


# ── Step 2: CensusData ────────────────────────────────────────────────────────
print("Step 2: Loading CensusData...")

census_rows: list[tuple] = []
seen_census: set[str] = set()
with open(f"{DATA_DIR}/acs_cleaned.csv", encoding="utf-8", errors="replace") as f:
    for row in csv.DictReader(f):
        zp = norm_zip(row.get("zip_code", ""))
        if zp not in valid_zips or zp in seen_census:
            continue
        seen_census.add(zp)
        census_rows.append((
            zp,
            to_float(row.get("median_household_income")),
            to_float(row.get("median_gross_rent")),
            None,  # education_level not present in ACS extract
            to_float(row.get("mean_commute_time")),
        ))

execute_values(
    cur,
    "INSERT INTO CensusData (zip_code, median_income, median_rent, commute_time) VALUES %s ON CONFLICT DO NOTHING",
    census_rows,
)
conn.commit()
print(f"  Inserted {len(census_rows)} census rows")


# ── Step 3: HousingData ───────────────────────────────────────────────────────
# Zillow is city-level ("New York, NY"). Map city+state -> zips via NCES.
print("Step 3: Loading HousingData (city->zip mapping)...")

city_state_to_zips: dict[tuple, list[str]] = {}
for zp, (city, state) in zip_to_city.items():
    if zp not in valid_zips:
        continue
    key = (city.lower().strip(), state.upper().strip())
    city_state_to_zips.setdefault(key, []).append(zp)

housing_batch: list[tuple] = []
housing_inserted = 0
BATCH = 5000


def flush_housing() -> None:
    global housing_inserted
    if housing_batch:
        execute_values(
            cur,
            "INSERT INTO HousingData (zip_code, date, home_value) VALUES %s ON CONFLICT DO NOTHING",
            housing_batch,
        )
        conn.commit()
        housing_inserted += len(housing_batch)
        housing_batch.clear()


with open(f"{DATA_DIR}/zillow_cleaned.csv", encoding="utf-8", errors="replace") as f:
    for row in csv.DictReader(f):
        region = (row.get("region_name") or "").strip()
        date = (row.get("date") or "").strip()
        hv = to_float(row.get("home_value"))
        if not region or not date or hv is None or ", " not in region:
            continue
        city_part, state_part = region.rsplit(", ", 1)
        key = (city_part.lower().strip(), state_part.upper().strip()[:2])
        for zp in city_state_to_zips.get(key, []):
            housing_batch.append((zp, date, hv))
            if len(housing_batch) >= BATCH:
                flush_housing()

flush_housing()
print(f"  Inserted ~{housing_inserted} housing rows")


# ── Step 4: School ────────────────────────────────────────────────────────────
print("Step 4: Loading School...")

ncessch_to_name_zip: dict[str, tuple[str, str]] = {}
school_insert: list[tuple] = []
seen_school_pairs: set[tuple] = set()
school_stats_from_nces: dict[tuple[str, str], tuple[float | None, int | None]] = {}

with open(f"{DATA_DIR}/nces_cleaned.csv", encoding="utf-8", errors="replace") as f:
    for row in csv.DictReader(f):
        ncessch = (row.get("NCESSCH") or "").strip()
        name = (row.get("SCH_NAME") or "").strip()
        zp = norm_zip(row.get("LZIP", ""))
        if not ncessch or not name or zp not in valid_zips:
            continue
        school_type_raw = (row.get("SCH_TYPE") or row.get("school_type") or "").strip().lower()
        school_type = "Charter" if "charter" in school_type_raw else "Public"
        g_lo = to_int(row.get("GSLO") or row.get("grade_low"))
        g_hi = to_int(row.get("GSHI") or row.get("grade_high"))
        grade_low = "K" if g_lo == 0 else str(g_lo) if g_lo is not None else None
        grade_high = "K" if g_hi == 0 else str(g_hi) if g_hi is not None else None
        grade_range = (
            f"{grade_low}-{grade_high}" if grade_low is not None and grade_high is not None else None
        )
        student_teacher_ratio = to_float(
            row.get("STUTERATIO") or row.get("student_teacher_ratio")
        )
        enrollment = to_int(row.get("MEMBER") or row.get("enrollment"))
        ncessch_to_name_zip[ncessch] = (name, zp)
        pair = (name, zp)
        if pair not in seen_school_pairs:
            seen_school_pairs.add(pair)
            school_insert.append((name, zp, school_type, grade_range))
            school_stats_from_nces[pair] = (student_teacher_ratio, enrollment)

execute_values(
    cur,
    """INSERT INTO School (name, zip_code, school_type, grade_range) VALUES %s
       ON CONFLICT (name, zip_code) DO UPDATE SET
         school_type = COALESCE(EXCLUDED.school_type, School.school_type),
         grade_range = COALESCE(EXCLUDED.grade_range, School.grade_range)""",
    school_insert,
)
conn.commit()

cur.execute("SELECT school_id, name, zip_code FROM School")
name_zip_to_id: dict[tuple, int] = {
    (name, zp): sid for sid, name, zp in cur.fetchall()
}

print(f"  Inserted {len(school_insert)} schools")

# Backfill publicly available NCES metrics for broader school coverage.
nces_stats_rows = []
for pair, (student_teacher_ratio, enrollment) in school_stats_from_nces.items():
    sid = name_zip_to_id.get(pair)
    if sid is None:
        continue
    if student_teacher_ratio is None and enrollment is None:
        continue
    nces_stats_rows.append((sid, None, student_teacher_ratio, enrollment))

if nces_stats_rows:
    execute_values(
        cur,
        """INSERT INTO SchoolStats (school_id, test_score, student_teacher_ratio, enrollment)
           VALUES %s
           ON CONFLICT (school_id) DO UPDATE SET
             student_teacher_ratio = COALESCE(EXCLUDED.student_teacher_ratio, SchoolStats.student_teacher_ratio),
             enrollment = COALESCE(EXCLUDED.enrollment, SchoolStats.enrollment)""",
        nces_stats_rows,
    )
    conn.commit()
print(f"  Upserted {len(nces_stats_rows)} NCES school stats rows")


# ── Step 5: SchoolStats ───────────────────────────────────────────────────────
# Match SEDA schools to NCES schools by name+state (crosswalk IDs differ).
print("Step 5: Loading SchoolStats...")

cur.execute("SELECT zip_code, state FROM ZipCode WHERE state IS NOT NULL")
zip_to_state = {zp: st for zp, st in cur.fetchall()}

name_state_to_id: dict[tuple, int] = {}
for (name, zp), sid in name_zip_to_id.items():
    state = zip_to_state.get(zp)
    if state:
        name_state_to_id[(name.lower().strip(), state.upper())] = sid

school_scores: dict[int, float] = {}
with open(f"{DATA_DIR}/seda_cleaned.csv", encoding="utf-8", errors="replace") as f:
    for row in csv.DictReader(f):
        if (row.get("subgroup") or "").strip().lower() != "all":
            continue
        name = (row.get("sedaschname") or "").strip()
        state = (row.get("stateabb") or "").strip().upper()
        score = to_float(row.get("cs_mn_avg_ol"))
        if not name or not state or score is None:
            continue
        sid = name_state_to_id.get((name.lower().strip(), state))
        if sid and sid not in school_scores:
            school_scores[sid] = score

stats_rows = [(sid, score, None, None) for sid, score in school_scores.items()]
if stats_rows:
    execute_values(
        cur,
        """INSERT INTO SchoolStats (school_id, test_score, student_teacher_ratio, enrollment)
           VALUES %s
           ON CONFLICT (school_id) DO UPDATE SET
             test_score = EXCLUDED.test_score""",
        stats_rows,
    )
    conn.commit()
print(f"  Inserted {len(stats_rows)} school stats")

cur.close()
conn.close()
print("\nAll done!")
