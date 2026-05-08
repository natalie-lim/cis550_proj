import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRowsMock, getPoolMock, getMockCompareMock } = vi.hoisted(() => ({
  queryRowsMock: vi.fn(),
  getPoolMock: vi.fn(),
  getMockCompareMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  queryRows: queryRowsMock,
  getPool: getPoolMock
}));

vi.mock("@/lib/mockData", () => ({
  getMockCompare: getMockCompareMock
}));

import { GET } from "@/app/api/compare/route";

describe("GET /api/compare", () => {
  beforeEach(() => {
    queryRowsMock.mockReset();
    getPoolMock.mockReset();
    getMockCompareMock.mockReset();
  });

  it("returns empty mock payload when no zips and no DB pool", async () => {
    getPoolMock.mockReturnValueOnce(null);
    const req = new Request("http://localhost:3000/api/compare");
    const res = await GET(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ zips: [], source: "mock" });
  });

  it("returns computed metrics for valid zips", async () => {
    getPoolMock.mockReturnValue({});
    queryRowsMock
      .mockResolvedValueOnce([
        { zip_code: "07090", city: "Westfield", state: "NJ" }
      ])
      .mockResolvedValueOnce([
        {
          zip_code: "07090",
          median_income: 180000,
          median_rent: 2500,
          commute_time: 35,
          unemployment_rate: 3.1,
          poverty_rate: 4.1
        }
      ])
      .mockResolvedValueOnce([
        {
          zip_code: "07090",
          latest_home_value: 1000000,
          first_home_value: 800000,
          avg_test_score: 0.9
        }
      ]);

    const req = new Request("http://localhost:3000/api/compare?zips=07090");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("database");
    expect(body.zips[0].yoy_growth_pct).toBeCloseTo(25);
    expect(body.zips[0].affordability_index).toBeCloseTo(1000000 / 180000);
    expect(body.zips[0].avg_school_test_score).toBe(0.9);
  });
});
