import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRowsMock, getMockStateZipsMock } = vi.hoisted(() => ({
  queryRowsMock: vi.fn(),
  getMockStateZipsMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  queryRows: queryRowsMock
}));

vi.mock("@/lib/mockData", () => ({
  getMockStateZips: getMockStateZipsMock
}));

import { GET } from "@/app/api/state/[stateCode]/route";

describe("GET /api/state/[stateCode]", () => {
  beforeEach(() => {
    queryRowsMock.mockReset();
    getMockStateZipsMock.mockReset();
  });

  it("returns 400 for invalid state code", async () => {
    const req = new Request("http://localhost:3000/api/state/NEW");
    const res = await GET(req, { params: Promise.resolve({ stateCode: "NEW" }) });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "state must be a two-letter US state code"
    });
  });

  it("falls back to mock data when DB returns no rows", async () => {
    queryRowsMock.mockResolvedValueOnce([]);
    getMockStateZipsMock.mockReturnValueOnce([
      { zip_code: "07090", city: "Westfield", median_income: 180000 }
    ]);

    const req = new Request("http://localhost:3000/api/state/NJ?limit=10");
    const res = await GET(req, { params: Promise.resolve({ stateCode: "NJ" }) });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      state: "NJ",
      zips: [{ zip_code: "07090", city: "Westfield", median_income: 180000 }],
      source: "mock"
    });
  });
});
