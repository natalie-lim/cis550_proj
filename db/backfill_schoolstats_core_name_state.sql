-- Tier 2 backfill for SchoolStats:
-- Match unresolved schools by (state + stripped core_name), where core_name
-- removes common generic words like "school", "high", "elementary", etc.

BEGIN;

CREATE TABLE IF NOT EXISTS schoolstats_match_audit (
  school_id INT PRIMARY KEY,
  match_method TEXT NOT NULL,
  match_key TEXT NOT NULL,
  candidate_count INT NOT NULL,
  source_school_ids INT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Build a lightweight staging table once, then index it for fast matching.
DROP TABLE IF EXISTS school_core_stage;
CREATE TEMP TABLE school_core_stage AS
SELECT
  s.school_id,
  z.state,
  btrim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    regexp_replace(
                      regexp_replace(lower(regexp_replace(s.name, '[^A-Za-z0-9 ]', ' ', 'g')), '\mhigh\M', ' ', 'g'),
                      '\mmiddle\M', ' ', 'g'
                    ),
                    '\melementary\M', ' ', 'g'
                  ),
                  '\mschool\M', ' ', 'g'
                ),
                '\mcharter\M', ' ', 'g'
              ),
              '\macademy\M', ' ', 'g'
            ),
            '\mthe\M', ' ', 'g'
          ),
          '\mof\M', ' ', 'g'
        ),
        '\mand\M', ' ', 'g'
      ),
      '\s+', ' ', 'g'
    )
  ) AS core_name,
  ss.test_score
FROM school s
JOIN zipcode z ON z.zip_code = s.zip_code
LEFT JOIN schoolstats ss ON ss.school_id = s.school_id;

CREATE INDEX ON school_core_stage (state, core_name);
CREATE INDEX ON school_core_stage (school_id);

WITH scored_agg AS (
  SELECT
    state,
    core_name,
    AVG(test_score) AS avg_test_score,
    COUNT(*) AS candidate_count,
    ARRAY_AGG(school_id ORDER BY school_id) AS source_school_ids
  FROM school_core_stage
  WHERE test_score IS NOT NULL
    AND core_name <> ''
  GROUP BY state, core_name
),
matchable AS (
  SELECT
    u.school_id,
    sa.avg_test_score,
    sa.candidate_count,
    sa.source_school_ids,
    (u.state || '|' || u.core_name) AS match_key
  FROM school_core_stage u
  JOIN scored_agg sa
    ON sa.state = u.state
   AND sa.core_name = u.core_name
  WHERE u.test_score IS NULL
    AND u.core_name <> ''
),
inserted_rows AS (
  INSERT INTO schoolstats (school_id, test_score, student_teacher_ratio, enrollment)
  SELECT
    m.school_id,
    m.avg_test_score,
    NULL,
    NULL
  FROM matchable m
  ON CONFLICT (school_id) DO NOTHING
  RETURNING school_id
)
INSERT INTO schoolstats_match_audit (
  school_id, match_method, match_key, candidate_count, source_school_ids
)
SELECT
  i.school_id,
  'core_name_state_from_existing_scores'::text AS match_method,
  m.match_key,
  m.candidate_count,
  m.source_school_ids
FROM inserted_rows i
JOIN matchable m ON m.school_id = i.school_id
ON CONFLICT (school_id) DO NOTHING;

COMMIT;

SELECT COUNT(*) AS schools_without_stats_after
FROM school s
LEFT JOIN schoolstats ss ON ss.school_id = s.school_id
WHERE ss.school_id IS NULL;

SELECT COUNT(*) AS tier2_imputed_rows
FROM schoolstats_match_audit
WHERE match_method = 'core_name_state_from_existing_scores';
