-- Text normalization cleanup
-- Purpose: standardize formatting without dropping rows.

BEGIN;

-- Normalize ZipCode text fields.
UPDATE ZipCode
SET
  city = CASE
    WHEN city IS NULL OR length(btrim(city)) = 0 THEN NULL
    ELSE initcap(btrim(city))
  END,
  state = CASE
    WHEN state IS NULL OR length(btrim(state)) = 0 THEN NULL
    ELSE upper(btrim(state))
  END;

-- Normalize School text fields.
UPDATE School
SET
  name = btrim(regexp_replace(name, '\s+', ' ', 'g')),
  school_type = CASE
    WHEN school_type IS NULL OR length(btrim(school_type)) = 0 THEN NULL
    WHEN upper(btrim(school_type)) LIKE '%CHARTER%' THEN 'Charter'
    ELSE 'Public'
  END,
  grade_range = CASE
    WHEN grade_range IS NULL OR length(btrim(grade_range)) = 0 THEN NULL
    -- normalize en/em dash to standard ASCII hyphen for consistency
    ELSE replace(replace(btrim(grade_range), '–', '-'), '—', '-')
  END;

COMMIT;

-- Post-cleanup checks
SELECT COUNT(*) AS bad_state_format_after
FROM ZipCode
WHERE state IS NOT NULL
  AND state !~ '^[A-Z]{2}$';

SELECT COUNT(*) AS blank_school_name_after
FROM School
WHERE name IS NULL OR length(btrim(name)) = 0;

SELECT COUNT(*) AS nonstandard_type_after
FROM School
WHERE school_type IS NOT NULL
  AND school_type NOT IN ('Public', 'Charter');
