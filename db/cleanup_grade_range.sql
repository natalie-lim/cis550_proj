-- Grade-range normalization cleanup for CIS 550 HomeZone Insights
-- Purpose: standardize School.grade_range into cleaner canonical values.

BEGIN;

UPDATE School
SET grade_range = CASE
  WHEN grade_range IS NULL OR length(btrim(grade_range)) = 0 THEN NULL
  WHEN upper(btrim(grade_range)) IN ('PK-PK', 'PREK-PREK', 'PK-0') THEN 'PK'
  WHEN upper(btrim(grade_range)) IN ('K-K', 'KG-KG') THEN 'K'
  -- Placeholder / unknown bucket in source; treat as missing.
  WHEN upper(btrim(grade_range)) IN ('M-M', 'N-N', 'U-U', 'UG-UG', 'AE-AE') THEN NULL
  ELSE upper(btrim(grade_range))
END;

COMMIT;

-- Post-cleanup checks
SELECT COUNT(*) AS remaining_dash_repeated_single_grade
FROM School
WHERE grade_range IN ('PK-PK', 'K-K', 'KG-KG', 'M-M', 'N-N', 'U-U', 'UG-UG', 'AE-AE');

SELECT COUNT(*) AS malformed_grade_pattern_after
FROM School
WHERE grade_range IS NOT NULL
  AND grade_range !~ '^(PK|K|[0-9]{1,2})(-(PK|K|[0-9]{1,2}))?$';

SELECT grade_range, COUNT(*)
FROM School
GROUP BY grade_range
ORDER BY COUNT(*) DESC
LIMIT 20;
