import { describe, it, expect } from "vitest";
import { getDashboardPath, getRoleBadge, getStatusColor } from "@/lib/utils";

describe("Middleware — getDashboardPath", () => {
  it("returns correct path for SUPER_ADMIN", () => {
    expect(getDashboardPath("SUPER_ADMIN")).toBe("/super-admin");
  });

  it("returns correct path for ADMIN", () => {
    expect(getDashboardPath("ADMIN")).toBe("/admin");
  });

  it("returns correct path for HR", () => {
    expect(getDashboardPath("HR")).toBe("/hr");
  });

  it("returns employee path for EMPLOYEE", () => {
    expect(getDashboardPath("EMPLOYEE")).toBe("/employee");
  });

  it("returns employee path for unknown role", () => {
    expect(getDashboardPath("UNKNOWN" as any)).toBe("/employee");
  });
});

describe("Middleware — getRoleBadge", () => {
  it("returns style for ADMIN", () => {
    expect(getRoleBadge("ADMIN")).toContain("purple");
  });

  it("returns style for HR", () => {
    expect(getRoleBadge("HR")).toContain("blue");
  });

  it("returns style for EMPLOYEE", () => {
    expect(getRoleBadge("EMPLOYEE")).toContain("gray");
  });

  it("returns fallback for unknown role", () => {
    expect(getRoleBadge("UNKNOWN")).toContain("gray");
  });
});

describe("Middleware — getStatusColor", () => {
  it("returns green for PRESENT", () => {
    expect(getStatusColor("PRESENT")).toContain("emerald");
  });

  it("returns amber for LATE", () => {
    expect(getStatusColor("LATE")).toContain("amber");
  });

  it("returns red for ABSENT", () => {
    expect(getStatusColor("ABSENT")).toContain("red");
  });

  it("returns fallback for unknown status", () => {
    expect(getStatusColor("UNKNOWN")).toBeDefined();
  });
});
