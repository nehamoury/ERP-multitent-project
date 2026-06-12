import { describe, it, expect } from "vitest";
import { isLateCheckIn, getLateMinutes, formatHours, calculateWorkingHours } from "@/lib/utils";

describe("isLateCheckIn", () => {
  it("returns false when check-in is before shift + threshold", () => {
    const checkIn = new Date("2024-01-15T09:10:00");
    expect(isLateCheckIn(checkIn, "09:00", 15)).toBe(false);
  });

  it("returns true when check-in is after shift + threshold", () => {
    const checkIn = new Date("2024-01-15T09:16:00");
    expect(isLateCheckIn(checkIn, "09:00", 15)).toBe(true);
  });

  it("returns true when check-in is significantly late", () => {
    const checkIn = new Date("2024-01-15T10:00:00");
    expect(isLateCheckIn(checkIn, "09:00", 15)).toBe(true);
  });

  it("returns false for exactly at threshold boundary", () => {
    const checkIn = new Date("2024-01-15T09:15:00");
    expect(isLateCheckIn(checkIn, "09:00", 15)).toBe(false);
  });

  it("uses default shift 09:00 and threshold 15", () => {
    const onTime = new Date("2024-01-15T09:10:00");
    const late = new Date("2024-01-15T09:20:00");
    expect(isLateCheckIn(onTime)).toBe(false);
    expect(isLateCheckIn(late)).toBe(true);
  });
});

describe("getLateMinutes", () => {
  it("returns 0 when on time", () => {
    const checkIn = new Date("2024-01-15T09:00:00");
    expect(getLateMinutes(checkIn, "09:00")).toBe(0);
  });

  it("returns correct minutes when late", () => {
    const checkIn = new Date("2024-01-15T09:30:00");
    expect(getLateMinutes(checkIn, "09:00")).toBe(30);
  });

  it("returns 0 for early check-in", () => {
    const checkIn = new Date("2024-01-15T08:45:00");
    expect(getLateMinutes(checkIn, "09:00")).toBe(0);
  });
});

describe("formatHours", () => {
  it("formats whole hours", () => {
    expect(formatHours(8)).toBe("8h 0m");
  });

  it("formats hours and minutes", () => {
    expect(formatHours(8.5)).toBe("8h 30m");
  });

  it("formats less than an hour", () => {
    expect(formatHours(0.25)).toBe("0h 15m");
  });

  it("handles zero", () => {
    expect(formatHours(0)).toBe("0h 0m");
  });
});

describe("calculateWorkingHours", () => {
  it("calculates correct hours", () => {
    const checkIn = new Date("2024-01-15T09:00:00");
    const checkOut = new Date("2024-01-15T17:00:00");
    expect(calculateWorkingHours(checkIn, checkOut)).toBe(8);
  });

  it("handles partial hours", () => {
    const checkIn = new Date("2024-01-15T09:00:00");
    const checkOut = new Date("2024-01-15T12:30:00");
    expect(calculateWorkingHours(checkIn, checkOut)).toBe(3.5);
  });

  it("returns 0 for invalid range", () => {
    const checkIn = new Date("2024-01-15T17:00:00");
    const checkOut = new Date("2024-01-15T09:00:00");
    expect(calculateWorkingHours(checkIn, checkOut)).toBe(0);
  });
});
