INSERT INTO ZipCode (zip_code, city, state) VALUES
  ('90210', 'Beverly Hills', 'CA'),
  ('10001', 'New York', 'NY'),
  ('60614', 'Chicago', 'IL')
ON CONFLICT (zip_code) DO NOTHING;

INSERT INTO CensusData (zip_code, median_income, median_rent, education_level, commute_time) VALUES
  ('90210', 125000, 2800, 0.62, 32),
  ('10001', 98000, 3200, 0.58, 35),
  ('60614', 112000, 2100, 0.60, 31)
ON CONFLICT (zip_code) DO UPDATE SET
  median_income = EXCLUDED.median_income,
  median_rent = EXCLUDED.median_rent,
  education_level = EXCLUDED.education_level,
  commute_time = EXCLUDED.commute_time;

INSERT INTO HousingData (zip_code, date, home_value) VALUES
  ('90210', '2023-01-01', 3200000),
  ('90210', '2024-01-01', 3350000),
  ('90210', '2025-01-01', 3480000),
  ('10001', '2023-01-01', 1450000),
  ('10001', '2024-01-01', 1520000),
  ('10001', '2025-01-01', 1580000),
  ('60614', '2023-01-01', 780000),
  ('60614', '2024-01-01', 805000),
  ('60614', '2025-01-01', 828000)
ON CONFLICT (zip_code, date) DO UPDATE SET
  home_value = EXCLUDED.home_value;

INSERT INTO School (name, zip_code) VALUES
  ('Beverly Hills High', '90210'),
  ('Midtown STEM Academy', '10001'),
  ('Lincoln Park High', '60614')
ON CONFLICT (name, zip_code) DO NOTHING;

INSERT INTO SchoolStats (school_id, test_score, student_teacher_ratio, enrollment)
SELECT s.school_id, 88, 18, 1200 FROM School s WHERE s.name = 'Beverly Hills High'
ON CONFLICT (school_id) DO UPDATE SET
  test_score = EXCLUDED.test_score,
  student_teacher_ratio = EXCLUDED.student_teacher_ratio,
  enrollment = EXCLUDED.enrollment;

INSERT INTO SchoolStats (school_id, test_score, student_teacher_ratio, enrollment)
SELECT s.school_id, 82, 14, 900 FROM School s WHERE s.name = 'Midtown STEM Academy'
ON CONFLICT (school_id) DO UPDATE SET
  test_score = EXCLUDED.test_score,
  student_teacher_ratio = EXCLUDED.student_teacher_ratio,
  enrollment = EXCLUDED.enrollment;

INSERT INTO SchoolStats (school_id, test_score, student_teacher_ratio, enrollment)
SELECT s.school_id, 79, 17, 1500 FROM School s WHERE s.name = 'Lincoln Park High'
ON CONFLICT (school_id) DO UPDATE SET
  test_score = EXCLUDED.test_score,
  student_teacher_ratio = EXCLUDED.student_teacher_ratio,
  enrollment = EXCLUDED.enrollment;
