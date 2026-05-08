import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRowsMock, getPoolMock } = vi.hoisted(() => ({
  queryRowsMock: vi.fn(),
  getPoolMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  queryRows: queryRowsMock,
  getPool: getPoolMock
}));

import { GET } from "@/app/api/zip/[zipCode]/schools/route";

describe("GET /api/zip/[zipCode]/schools", () => {
  beforeEach(() => {
    queryRowsMock.mockReset();
    getPoolMock.mockReset();
  });

  it("rejects invalid zip format", async () => {
    const req = new Request("http://localhost:3000/api/zip/abc/schools");
    const res = await GET(req, { params: Promise.resolve({ zipCode: "abc" }) });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "zip_code must be exactly 5 digits"
    });
  });

  it("returns 404 when DB has no schools for valid zip", async () => {
    queryRowsMock.mockResolvedValueOnce([]);
    getPoolMock.mockReturnValue({});

    const req = new Request("http://localhost:3000/api/zip/07090/schools");
    const res = await GET(req, { params: Promise.resolve({ zipCode: "07090" }) });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "No schools found for ZIP" });
  });
});
