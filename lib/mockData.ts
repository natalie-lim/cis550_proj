import type {
  CompareResponse,
  HousingPoint,
  InsightListResponse,
  InsightRow,
  StateZipSnippet,
  ZipDetailResponse
} from "@/lib/types";

const mockZipDetail: Record<string, ZipDetailResponse> = {
  "90001": {
    zip: { zip_code: "90001", city: "Los Angeles", state: "CA" },
    census: {
      median_income: 125000,
      median_rent: 2800,
      unemployment_rate: 4.2,
      poverty_rate: 8.1,
      commute_time: 32
    },
    housingSeries: [
      { date: "2023-01-01", home_value: 3200000 },
      { date: "2023-07-01", home_value: 3280000 },
      { date: "2024-01-01", home_value: 3350000 },
      { date: "2024-07-01", home_value: 3410000 },
      { date: "2025-01-01", home_value: 3480000 }
    ],
    schools: [
      {
        school_id: 1,
        name: "Beverly Hills High",
        test_score: 1.2,
        school_type: "Public",
        grade_range: "9-12"
      }
    ],
    source: "mock"
  },
  "10001": {
    zip: { zip_code: "10001", city: "New York", state: "NY" },
    census: {
      median_income: 98000,
      median_rent: 3200,
      unemployment_rate: 5.8,
      poverty_rate: 14.2,
      commute_time: 35
    },
    housingSeries: [
      { date: "2023-01-01", home_value: 1450000 },
      { date: "2024-01-01", home_value: 1520000 },
      { date: "2025-01-01", home_value: 1580000 }
    ],
    schools: [
      {
        school_id: 2,
        name: "Midtown STEM Academy",
        test_score: 0.8,
        school_type: "Charter",
        grade_range: "6-12"
      }
    ],
    source: "mock"
  }
};

export function getMockZipDetail(zip: string): ZipDetailResponse {
  const normalized: string = zip.trim();
  const hit: ZipDetailResponse | undefined = mockZipDetail[normalized];
  if (hit) {
    return hit;
  }
  return {
    zip: { zip_code: normalized, city: "Sample City", state: "US" },
    census: {
      median_income: 72000,
      median_rent: 1650,
      unemployment_rate: 6.1,
      poverty_rate: 12.4,
      commute_time: 28
    },
    housingSeries: [
      { date: "2023-01-01", home_value: 420000 },
      { date: "2024-01-01", home_value: 438000 },
      { date: "2025-01-01", home_value: 451000 }
    ],
    schools: [
      {
        school_id: 99,
        name: "Neighborhood Public School",
        test_score: 0.1,
        school_type: "Public",
        grade_range: "K-8"
      }
    ],
    source: "mock"
  };
}

export function getMockCompare(zips: string[]): CompareResponse {
  const metrics = zips.map((z) => {
    const detail: ZipDetailResponse = getMockZipDetail(z);
    const latest: HousingPoint | undefined =
      detail.housingSeries[detail.housingSeries.length - 1];
    const first: HousingPoint | undefined = detail.housingSeries[0];
    let yoy: number | null = null;
    if (latest?.home_value && first?.home_value && first.home_value > 0) {
      yoy =
        ((latest.home_value - first.home_value) / first.home_value) * 100;
    }
    const income: number | null = detail.census?.median_income ?? null;
    const affordability: number | null =
      income && latest?.home_value ? latest.home_value / income : null;
    const avgSchool: number | null =
      detail.schools.length > 0
        ? detail.schools.reduce(
            (acc, s) => acc + (s.test_score ?? 0),
            0
          ) / detail.schools.length
        : null;
    return {
      zip: detail.zip,
      census: detail.census,
      latest_home_value: latest?.home_value ?? null,
      yoy_growth_pct: yoy,
      affordability_index: affordability,
      avg_school_test_score: avgSchool
    };
  });
  return { zips: metrics, source: "mock" };
}

export function getMockTopGrowth(limit: number): InsightListResponse {
  const rows: ReadonlyArray<InsightRow> = [
    {
      zip_code: "37211",
      city: "Nashville",
      state: "TN",
      metric_value: 18.4,
      detail: "YoY ZHVI-style growth with below-median income filter"
    },
    {
      zip_code: "78704",
      city: "Austin",
      state: "TX",
      metric_value: 15.1,
      detail: "High appreciation vs national median income benchmark"
    },
    {
      zip_code: "30309",
      city: "Atlanta",
      state: "GA",
      metric_value: 12.7,
      detail: "Emerging neighborhood price momentum"
    }
  ].slice(0, limit);
  return { results: rows, source: "mock" };
}

export function getMockUndervalued(limit: number): InsightListResponse {
  const rows: ReadonlyArray<InsightRow> = [
    {
      zip_code: "15213",
      city: "Pittsburgh",
      state: "PA",
      metric_value: 1.42,
      detail: "School quality percentile materially exceeds price percentile"
    },
    {
      zip_code: "27705",
      city: "Durham",
      state: "NC",
      metric_value: 1.31,
      detail: "Strong test scores vs moderate ZHVI"
    }
  ].slice(0, limit);
  return { results: rows, source: "mock" };
}

export function getMockAffordability(
  state: string | null,
  limit: number
): InsightListResponse {
  const rows: ReadonlyArray<InsightRow> = [
    {
      zip_code: "84101",
      city: "Salt Lake City",
      state: "UT",
      metric_value: 4.2,
      detail: "Home value to income ratio (lower is more affordable)"
    },
    {
      zip_code: "55404",
      city: "Minneapolis",
      state: "MN",
      metric_value: 4.6,
      detail: "ZIP-level affordability index within metro"
    }
  ]
    .filter((r) => (state ? r.state === state.toUpperCase() : true))
    .slice(0, limit);
  return { results: rows, source: "mock" };
}

export function getMockStateZips(stateCode: string): readonly StateZipSnippet[] {
  const state = stateCode.trim().toUpperCase();
  const byState: Record<string, readonly StateZipSnippet[]> = {
    PA: [
      { zip_code: "19104", city: "Philadelphia", median_income: 32458 },
      { zip_code: "19103", city: "Philadelphia", median_income: 112608 },
      { zip_code: "15213", city: "Pittsburgh", median_income: 53620 }
    ],
    CA: [
      { zip_code: "90001", city: "Los Angeles", median_income: 65123 },
      { zip_code: "94110", city: "San Francisco", median_income: 142911 },
      { zip_code: "92101", city: "San Diego", median_income: 99510 }
    ],
    NY: [
      { zip_code: "10001", city: "New York", median_income: 97640 },
      { zip_code: "11201", city: "Brooklyn", median_income: 117332 },
      { zip_code: "14604", city: "Rochester", median_income: 41810 }
    ]
  };

  return byState[state] ?? [
    { zip_code: "10001", city: "Sample City", median_income: 72000 },
    { zip_code: "10002", city: "Sample City", median_income: 68800 }
  ];
}
