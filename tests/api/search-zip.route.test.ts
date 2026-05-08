import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRowsMock } = vi.hoisted(() => ({
  queryRowsMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  queryRows: queryRowsMock
}));

import { GET } from "@/app/api/search/zip/route";

describe("GET /api/search/zip", () => {
  beforeEach(() => {
    queryRowsMock.mockReset();
  });

  it("returns 400 when query is too short", async () => {
    const req = new Request("http://localhost:3000/api/search/zip?q=9");
    const res = await GET(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "q must be at least 2 characters"
    });
  });

  it("clamps limit and maps city/state display name", async () => {
    queryRowsMock.mockResolvedValueOnce([
      { zip_code: "07090", city: "Westfield", state: "NJ" }
    ]);

    const req = new Request(
      "http://localhost:3000/api/search/zip?q=07&limit=999"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([
      { zip_code: "07090", name: "Westfield, NJ" }
    ]);
    expect(queryRowsMock).toHaveBeenCalledWith(expect.any(String), ["07", 25]);
  });
});
