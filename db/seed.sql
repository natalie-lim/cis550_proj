-- HomeZone Insights — sample seed data for local development
-- Run with: psql "<DATABASE_URL>" -f db/seed.sql

INSERT INTO ZipCode (zip_code, city, state) VALUES
  ('10001', 'New York',    'NY'),
  ('60614', 'Chicago',     'IL'),
  ('90001', 'Los Angeles', 'CA')
ON CONFLICT (zip_code) DO NOTHING;

-- unemployment_rate and poverty_rate from ACS (percentage values)
INSERT INTO CensusData (zip_code, median_income, median_rent, commute_time, unemployment_rate, poverty_rate) VALUES
  ('10001', 98000, 3200, 35, 5.8, 14.2),
  ('60614', 85000, 1900, 30, 4.1,  9.7),
  ('90001', 52000, 1450, 38, 7.3, 22.4)
ON CONFLICT (zip_code) DO UPDATE SET
  median_income     = EXCLUDED.median_income,
  median_rent       = EXCLUDED.median_rent,
  commute_time      = EXCLUDED.commute_time,
  unemployment_rate = EXCLUDED.unemployment_rate,
  poverty_rate      = EXCLUDED.poverty_rate;

INSERT INTO HousingData (zip_code, date, home_value) VALUES
  ('10001', '2023-01-01', 1450000),
  ('10001', '2024-01-01', 1520000),
  ('10001', '2025-01-01', 1580000),
  ('60614', '2023-01-01',  520000),
  ('60614', '2024-01-01',  548000),
  ('60614', '2025-01-01',  572000),
  ('90001', '2023-01-01',  610000),
  ('90001', '2024-01-01',  645000),
  ('90001', '2025-01-01',  670000)
ON CONFLICT (zip_code, date) DO UPDATE SET
  home_value = EXCLUDED.home_value;

-- school_type and grade_range from NCES
INSERT INTO School (name, zip_code, school_type, grade_range) VALUES
  ('Midtown STEM Academy',     '10001', 'Charter', 'K-8'),
  ('Lincoln Park High School', '60614', 'Public',  '9-12'),
  ('South LA Elementary',      '90001', 'Public',  'K-5')
ON CONFLICT (name, zip_code) DO UPDATE SET
  school_type = EXCLUDED.school_type,
  grade_range = EXCLUDED.grade_range;

-- test_score is a SEDA cohort-standardized z-score (0 = national average, +1 = one SD above)
INSERT INTO SchoolStats (school_id, test_score, student_teacher_ratio, enrollment)
  SELECT school_id, 0.82, NULL, NULL FROM School WHERE name = 'Midtown STEM Academy'
ON CONFLICT (school_id) DO UPDATE SET test_score = EXCLUDED.test_score;

INSERT INTO SchoolStats (school_id, test_score, student_teacher_ratio, enrollment)
  SELECT school_id, 0.54, NULL, NULL FROM School WHERE name = 'Lincoln Park High School'
ON CONFLICT (school_id) DO UPDATE SET test_score = EXCLUDED.test_score;

INSERT INTO SchoolStats (school_id, test_score, student_teacher_ratio, enrollment)
  SELECT school_id, -0.21, NULL, NULL FROM School WHERE name = 'South LA Elementary'
ON CONFLICT (school_id) DO UPDATE SET test_score = EXCLUDED.test_score;
