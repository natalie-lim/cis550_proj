-- Backfill missing ZipCode city/state from a ZIP reference table.
-- Requires table `zipcode_reference(zip_code, city, state)` to be loaded first.

WITH updated AS (
  UPDATE ZipCode z
  SET
    city = CASE
      WHEN z.city IS NULL OR length(btrim(z.city)) = 0 THEN initcap(btrim(r.city))
      ELSE z.city
    END,
    state = CASE
      WHEN z.state IS NULL OR length(btrim(z.state)) = 0 THEN upper(btrim(r.state))
      ELSE z.state
    END
  FROM zipcode_reference r
  WHERE z.zip_code = r.zip_code
    AND (
      z.city IS NULL OR length(btrim(z.city)) = 0
      OR z.state IS NULL OR length(btrim(z.state)) = 0
    )
  RETURNING z.zip_code
)
SELECT COUNT(*) AS rows_backfilled
FROM updated;
