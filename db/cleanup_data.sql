-- Data cleanup for CIS 550 HomeZone Insights
-- Purpose: normalize invalid sentinel/impossible numeric values to NULL
-- without dropping rows, so query logic can safely use IS NOT NULL filters.

BEGIN;

-- CensusData cleanup
-- Sentinel values (e.g., -666666666) and non-positive incomes/rents are invalid.
UPDATE CensusData
SET
  median_income = CASE
    WHEN median_income IS NULL OR median_income <= 0 OR median_income <= -9999 THEN NULL
    ELSE median_income
  END,
  median_rent = CASE
    WHEN median_rent IS NULL OR median_rent < 0 OR median_rent <= -9999 THEN NULL
    ELSE median_rent
  END,
  poverty_rate = CASE
    WHEN poverty_rate IS NULL OR poverty_rate < 0 OR poverty_rate > 100 OR poverty_rate <= -9999 THEN NULL
    ELSE poverty_rate
  END,
  unemployment_rate = CASE
    WHEN unemployment_rate IS NULL OR unemployment_rate < 0 OR unemployment_rate > 100 OR unemployment_rate <= -9999 THEN NULL
    ELSE unemployment_rate
  END,
  commute_time = CASE
    WHEN commute_time IS NULL OR commute_time < 0 OR commute_time > 120 OR commute_time <= -9999 THEN NULL
    ELSE commute_time
  END;

COMMIT;

-- Post-cleanup checks
SELECT COUNT(*) AS income_nonpositive_after
FROM CensusData
WHERE median_income <= 0;

SELECT COUNT(*) AS rent_negative_after
FROM CensusData
WHERE median_rent < 0;

SELECT COUNT(*) AS invalid_pct_after
FROM CensusData
WHERE poverty_rate < 0
   OR poverty_rate > 100
   OR unemployment_rate < 0
   OR unemployment_rate > 100;
