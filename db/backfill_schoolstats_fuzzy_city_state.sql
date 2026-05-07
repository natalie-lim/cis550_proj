-- Tier 3 backfill for SchoolStats:
-- Conservative fuzzy matching by normalized name within same state+city.
-- Rules:
-- 1) similarity >= 0.94
-- 2) best match must be unique and clearly better than second best by >= 0.03
-- 3) only unresolved schools are eligible

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS schoolstats_match_audit (
  school_id INT PRIMARY KEY,
  match_method TEXT NOT NULL,
  match_key TEXT NOT NULL,
  candidate_count INT NOT NULL,
  source_school_ids INT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS school_name_stage;
CREATE TEMP TABLE school_name_stage AS
SELECT
  s.school_id,
  z.state,
  z.city,
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
LEFT JOIN schoolstats ss ON ss.school_id = s.school_id;

CREATE INDEX ON school_name_stage (state, city);
CREATE INDEX ON school_name_stage USING gin (norm_name gin_trgm_ops);

WITH unresolved AS (
  SELECT school_id, state, city, norm_name
  FROM school_name_stage
  WHERE test_score IS NULL
    AND norm_name <> ''
    AND char_length(norm_name) >= 6
),
scored AS (
  SELECT school_id, state, city, norm_name, test_score
  FROM school_name_stage
  WHERE test_score IS NOT NULL
    AND norm_name <> ''
    AND char_length(norm_name) >= 6
),
pair_scores AS (
  SELECT
    u.school_id AS unresolved_id,
    s.school_id AS scored_id,
    s.test_score,
    similarity(u.norm_name, s.norm_name) AS sim,
    ROW_NUMBER() OVER (
      PARTITION BY u.school_id
      ORDER BY similarity(u.norm_name, s.norm_name) DESC, s.school_id
    ) AS rn,
    LEAD(similarity(u.norm_name, s.norm_name)) OVER (
      PARTITION BY u.school_id
      ORDER BY similarity(u.norm_name, s.norm_name) DESC, s.school_id
    ) AS second_sim
  FROM unresolved u
  JOIN scored s
    ON s.state = u.state
   AND s.city = u.city
  WHERE LEFT(s.norm_name, 1) = LEFT(u.norm_name, 1)
    AND similarity(u.norm_name, s.norm_name) >= 0.94
),
best_unique AS (
  SELECT
    p.unresolved_id AS school_id,
    p.test_score,
    p.scored_id,
    p.sim,
    p.second_sim
  FROM pair_scores p
  WHERE p.rn = 1
    AND (p.second_sim IS NULL OR p.sim - p.second_sim >= 0.03)
),
inserted_rows AS (
  INSERT INTO schoolstats (school_id, test_score, student_teacher_ratio, enrollment)
  SELECT
    b.school_id,
    b.test_score,
    NULL,
    NULL
  FROM best_unique b
  ON CONFLICT (school_id) DO NOTHING
  RETURNING school_id
)
INSERT INTO schoolstats_match_audit (
  school_id, match_method, match_key, candidate_count, source_school_ids
)
SELECT
  i.school_id,
  'fuzzy_name_city_state_unique_best'::text AS match_method,
  ('sim=' || ROUND(b.sim::numeric, 4)::text) AS match_key,
  1 AS candidate_count,
  ARRAY[b.scored_id] AS source_school_ids
FROM inserted_rows i
JOIN best_unique b ON b.school_id = i.school_id
ON CONFLICT (school_id) DO NOTHING;

COMMIT;

SELECT COUNT(*) AS schools_without_stats_after
FROM school s
LEFT JOIN schoolstats ss ON ss.school_id = s.school_id
WHERE ss.school_id IS NULL;

SELECT COUNT(*) AS tier3_imputed_rows
FROM schoolstats_match_audit
WHERE match_method = 'fuzzy_name_city_state_unique_best';
