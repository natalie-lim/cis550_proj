export type ZipSummary = {
  zip_code: string;
  city: string | null;
  state: string | null;
};

export type CensusRow = {
  median_income: number | null;
  median_rent: number | null;
  education_level: number | null;
  commute_time: number | null;
};

export type HousingPoint = {
  date: string;
  home_value: number | null;
};

export type SchoolRow = {
  school_id: number;
  name: string;
  test_score: number | null;
  student_teacher_ratio: number | null;
  enrollment: number | null;
};

export type ZipDetailResponse = {
  zip: ZipSummary;
  census: CensusRow | null;
  housingSeries: HousingPoint[];
  schools: SchoolRow[];
  source: "database" | "mock";
};

export type CompareZipMetric = {
  zip: ZipSummary;
  census: CensusRow | null;
  latest_home_value: number | null;
  yoy_growth_pct: number | null;
  affordability_index: number | null;
  avg_school_test_score: number | null;
};

export type CompareResponse = {
  zips: CompareZipMetric[];
  source: "database" | "mock";
};

export type InsightRow = {
  zip_code: string;
  city: string | null;
  state: string | null;
  metric_value: number | null;
  detail: string | null;
};

export type InsightListResponse = {
  results: ReadonlyArray<InsightRow>;
  source: "database" | "mock";
};
