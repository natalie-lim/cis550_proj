import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => React.createElement("a", { href, className }, children)
}));

vi.mock("@/components/AuthStatus", () => ({
  AuthStatus: () => React.createElement("div", { "data-testid": "auth-status" }, "Auth")
}));

import { SiteNav } from "@/components/SiteNav";

describe("SiteNav", () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
  });

  it("renders all primary nav links", () => {
    usePathnameMock.mockReturnValue("/");
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Compare" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Insights" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "History" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.getByTestId("auth-status")).toBeInTheDocument();
  });

  it("highlights the active route pill", () => {
    usePathnameMock.mockReturnValue("/insights");
    render(<SiteNav />);
    const active = screen.getByRole("link", { name: "Insights" });
    expect(active.className).toContain("bg-blue-100");
  });
});
