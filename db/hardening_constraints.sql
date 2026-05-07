-- Data quality hardening constraints for CIS 550 HomeZone Insights
-- Purpose: prevent future reloads from reintroducing invalid values.

-- ZipCode checks
ALTER TABLE ZipCode
  ADD CONSTRAINT zipcode_zip_format_chk
  CHECK (zip_code ~ '^[0-9]{5}$');

ALTER TABLE ZipCode
  ADD CONSTRAINT zipcode_state_format_chk
  CHECK (state IS NULL OR state ~ '^[A-Z]{2}$');

-- CensusData checks
ALTER TABLE CensusData
  ADD CONSTRAINT census_income_positive_chk
  CHECK (median_income IS NULL OR median_income > 0);

ALTER TABLE CensusData
  ADD CONSTRAINT census_rent_nonnegative_chk
  CHECK (median_rent IS NULL OR median_rent >= 0);

ALTER TABLE CensusData
  ADD CONSTRAINT census_commute_range_chk
  CHECK (commute_time IS NULL OR (commute_time >= 0 AND commute_time <= 120));

ALTER TABLE CensusData
  ADD CONSTRAINT census_unemployment_pct_chk
  CHECK (unemployment_rate IS NULL OR (unemployment_rate >= 0 AND unemployment_rate <= 100));

ALTER TABLE CensusData
  ADD CONSTRAINT census_poverty_pct_chk
  CHECK (poverty_rate IS NULL OR (poverty_rate >= 0 AND poverty_rate <= 100));

-- HousingData checks
ALTER TABLE HousingData
  ADD CONSTRAINT housing_value_positive_chk
  CHECK (home_value IS NULL OR home_value > 0);

ALTER TABLE HousingData
  ADD CONSTRAINT housing_zip_format_chk
  CHECK (zip_code IS NULL OR zip_code ~ '^[0-9]{5}$');

-- School checks
ALTER TABLE School
  ADD CONSTRAINT school_name_not_blank_chk
  CHECK (length(btrim(name)) > 0);

ALTER TABLE School
  ADD CONSTRAINT school_zip_format_chk
  CHECK (zip_code IS NULL OR zip_code ~ '^[0-9]{5}$');

ALTER TABLE School
  ADD CONSTRAINT school_type_enum_chk
  CHECK (school_type IS NULL OR school_type IN ('Public', 'Charter'));

ALTER TABLE School
  ADD CONSTRAINT school_grade_pattern_chk
  CHECK (
    grade_range IS NULL
    OR grade_range ~ '^(PK|K|[0-9]{1,2})(-(PK|K|[0-9]{1,2}))?$'
  );

-- SchoolStats checks
ALTER TABLE SchoolStats
  ADD CONSTRAINT schoolstats_score_reasonable_chk
  CHECK (test_score IS NULL OR (test_score >= -5 AND test_score <= 5));

ALTER TABLE SchoolStats
  ADD CONSTRAINT schoolstats_ratio_positive_chk
  CHECK (student_teacher_ratio IS NULL OR student_teacher_ratio > 0);

ALTER TABLE SchoolStats
  ADD CONSTRAINT schoolstats_enrollment_positive_chk
  CHECK (enrollment IS NULL OR enrollment > 0);
