-- Backfill missing SchoolStats rows using normalized school name + state.
-- This uses already-scored schools as anchors and imputes test_score only.

BEGIN;

-- Audit trail for imputed rows.
CREATE TABLE IF NOT EXISTS schoolstats_match_audit (
  school_id INT PRIMARY KEY,
  match_method TEXT NOT NULL,
  match_key TEXT NOT NULL,
  candidate_count INT NOT NULL,
  source_school_ids INT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

WITH scored AS (
  SELECT
    s.school_id,
    z.state,
    btrim(
      lower(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(s.name, '[^A-Za-z0-9 ]', ' ', 'g'),
                  '\mhs\M', ' high school ', 'g'
                ),
                '\melem\M', ' elementary ', 'g'
              ),
              '\msch\M', ' school ', 'g'
            ),
            '\mcs\M', ' charter school ', 'g'
          ),
          '\s+', ' ', 'g'
        )
      )
    ) AS norm_name,
    ss.test_score
  FROM school s
  JOIN zipcode z ON z.zip_code = s.zip_code
  JOIN schoolstats ss ON ss.school_id = s.school_id
  WHERE ss.test_score IS NOT NULL
),
scored_agg AS (
  SELECT
    state,
    norm_name,
    AVG(test_score) AS avg_test_score,
    COUNT(*) AS candidate_count,
    ARRAY_AGG(school_id ORDER BY school_id) AS source_school_ids
  FROM scored
  GROUP BY state, norm_name
),
unresolved AS (
  SELECT
    s.school_id,
    z.state,
    btrim(
      lower(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(s.name, '[^A-Za-z0-9 ]', ' ', 'g'),
                  '\mhs\M', ' high school ', 'g'
                ),
                '\melem\M', ' elementary ', 'g'
              ),
              '\msch\M', ' school ', 'g'
            ),
            '\mcs\M', ' charter school ', 'g'
          ),
          '\s+', ' ', 'g'
        )
      )
    ) AS norm_name
  FROM school s
  JOIN zipcode z ON z.zip_code = s.zip_code
  LEFT JOIN schoolstats ss ON ss.school_id = s.school_id
  WHERE ss.school_id IS NULL
),
matchable AS (
  SELECT
    u.school_id,
    a.avg_test_score,
    a.candidate_count,
    a.source_school_ids,
    (u.state || '|' || u.norm_name) AS match_key
  FROM unresolved u
  JOIN scored_agg a
    ON a.state = u.state
   AND a.norm_name = u.norm_name
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
  'normalized_name_state_from_existing_scores'::text AS match_method,
  m.match_key,
  m.candidate_count,
  m.source_school_ids
FROM inserted_rows i
JOIN matchable m ON m.school_id = i.school_id
ON CONFLICT (school_id) DO NOTHING;

COMMIT;

-- Post-run summary
SELECT COUNT(*) AS schools_without_stats_after
FROM school s
LEFT JOIN schoolstats ss ON ss.school_id = s.school_id
WHERE ss.school_id IS NULL;

SELECT COUNT(*) AS imputed_rows_total
FROM schoolstats_match_audit;
