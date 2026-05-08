-- HomeZone Insights, PostgreSQL schema
-- Run with: psql "<DATABASE_URL>" -f db/schema.sql

CREATE TABLE IF NOT EXISTS ZipCode (
  zip_code VARCHAR(10) PRIMARY KEY,
  city     VARCHAR(100),
  state    VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS HousingData (
  id         SERIAL PRIMARY KEY,
  zip_code   VARCHAR(10) REFERENCES ZipCode (zip_code),
  date       DATE NOT NULL,
  home_value DOUBLE PRECISION,
  UNIQUE (zip_code, date)
);

CREATE TABLE IF NOT EXISTS CensusData (
  zip_code          VARCHAR(10) PRIMARY KEY REFERENCES ZipCode (zip_code),
  median_income     DOUBLE PRECISION,
  median_rent       DOUBLE PRECISION,
  commute_time      DOUBLE PRECISION,
  unemployment_rate DOUBLE PRECISION,
  poverty_rate      DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS School (
  school_id  SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  zip_code   VARCHAR(10) REFERENCES ZipCode (zip_code),
  school_type VARCHAR(50),
  grade_range VARCHAR(20),
  UNIQUE (name, zip_code)
);

CREATE TABLE IF NOT EXISTS SchoolStats (
  school_id            INT PRIMARY KEY REFERENCES School (school_id),
  test_score           DOUBLE PRECISION,
  student_teacher_ratio DOUBLE PRECISION,
  enrollment           INT
);

CREATE INDEX IF NOT EXISTS idx_housing_zip_date ON HousingData (zip_code, date);
CREATE INDEX IF NOT EXISTS idx_school_zip       ON School (zip_code);
