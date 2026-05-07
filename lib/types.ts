// Shared TypeScript types for API request/response shapes.
// These mirror the PostgreSQL schema and are imported by both route handlers and pages.

/** A ZIP code entry with optional city and state from the ZipCode table. */
export type ZipSummary = {
  zip_code: string;
  city: string | null;
  state: string | null;
};

/** Census demographics for a ZIP from the CensusData table. */
export type CensusRow = {
  median_income: number | null;
  median_rent: number | null;
  commute_time: number | null;
  /** Percentage of the labor force that is unemployed (from ACS). */
  unemployment_rate: number | null;
  /** Percentage of residents below the poverty line (from ACS). */
  poverty_rate: number | null;
};

/** One data point in the home-value time series from HousingData. */
export type HousingPoint = {
  date: string;
  home_value: number | null;
};

/** A school record joined with its SchoolStats row. */
export type SchoolRow = {
  school_id: number;
  name: string;
  /** SEDA cohort-standardized test score (z-score; 0 = national average). */
  test_score: number | null;
  /** NCES public data field; lower is generally better. */
  student_teacher_ratio: number | null;
  /** NCES membership count (student enrollment). */
  enrollment: number | null;
  /** "Public" or "Charter" from NCES. */
  school_type: string | null;
  /** Grade range string, e.g. "K-8", "9-12" (from NCES GSLO/GSHI). */
  grade_range: string | null;
};

/** Full response for the /api/zip/[zipCode] route. */
export type ZipDetailResponse = {
  zip: ZipSummary;
  census: CensusRow | null;
  housingSeries: HousingPoint[];
  schools: SchoolRow[];
  source: "database" | "mock";
};

/** Metrics for one ZIP in the side-by-side compare view. */
export type CompareZipMetric = {
  zip: ZipSummary;
  census: CensusRow | null;
  latest_home_value: number | null;
  yoy_growth_pct: number | null;
  affordability_index: number | null;
  avg_school_test_score: number | null;
};

/** Response for the /api/compare route. */
export type CompareResponse = {
  zips: CompareZipMetric[];
  source: "database" | "mock";
};

/** One row returned by any of the /api/insights/* routes. */
export type InsightRow = {
  zip_code: string;
  city: string | null;
  state: string | null;
  /** The primary numeric metric for this insight type (growth %, ratio, etc.). */
  metric_value: number | null;
  detail: string | null;
};

/** Response for all /api/insights/* routes. */
export type InsightListResponse = {
  results: ReadonlyArray<InsightRow>;
  source: "database" | "mock";
};

/** One ZIP snippet returned by /api/state/[stateCode]. */
export type StateZipSnippet = {
  zip_code: string;
  city: string | null;
  median_income: number | null;
};

/** Response shape for /api/state/[stateCode]. */
export type StateZipListResponse = {
  state: string;
  zips: ReadonlyArray<StateZipSnippet>;
  source: "database" | "mock";
};
