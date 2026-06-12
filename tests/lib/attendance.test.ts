import { describe, it, expect } from "vitest";
import { isLateCheckIn, getLateMinutes, calculateWorkingHours, formatHours } from "@/lib/utils";

describe("Attendance Business Logic", () => {
  describe("Late Detection", () => {
    it("detects late check-in with custom shift and threshold", () => {
      const checkIn = new Date("2024-01-15T10:00:00");
      expect(isLateCheckIn(checkIn, "09:00", 15)).toBe(true);
    });

    it("allows grace period", () => {
      const onTime = new Date("2024-01-15T09:14:00");
      expect(isLateCheckIn(onTime, "09:00", 15)).toBe(false);
    });

    it("marks as late exactly at threshold edge", () => {
      const atEdge = new Date("2024-01-15T09:16:00");
      expect(isLateCheckIn(atEdge, "09:00", 15)).toBe(true);
    });

    it("handles early check-in (before shift)", () => {
      const early = new Date("2024-01-15T08:30:00");
      expect(isLateCheckIn(early, "09:00", 15)).toBe(false);
    });
  });

  describe("Late Minutes Calculation", () => {
    it("calculates exact late minutes", () => {
      const checkIn = new Date("2024-01-15T09:45:00");
      expect(getLateMinutes(checkIn, "09:00")).toBe(45);
    });

    it("returns 0 for early check-in", () => {
      const checkIn = new Date("2024-01-15T08:00:00");
      expect(getLateMinutes(checkIn, "09:00")).toBe(0);
    });
  });

  describe("Working Hours Calculation", () => {
    it("calculates full day", () => {
      const checkIn = new Date("2024-01-15T09:00:00");
      const checkOut = new Date("2024-01-15T18:00:00");
      expect(calculateWorkingHours(checkIn, checkOut)).toBe(9);
    });

    it("calculates half day", () => {
      const checkIn = new Date("2024-01-15T09:00:00");
      const checkOut = new Date("2024-01-15T13:00:00");
      expect(calculateWorkingHours(checkIn, checkOut)).toBe(4);
    });

    it("handles checkout before checkin (returns 0)", () => {
      const checkIn = new Date("2024-01-15T14:00:00");
      const checkOut = new Date("2024-01-15T09:00:00");
      expect(calculateWorkingHours(checkIn, checkOut)).toBe(0);
    });
  });

  describe("Format Hours", () => {
    it("formats standard work day", () => {
      expect(formatHours(8)).toBe("8h 0m");
    });

    it("formats with minutes", () => {
      expect(formatHours(7.75)).toBe("7h 45m");
    });

    it("formats zero", () => {
      expect(formatHours(0)).toBe("0h 0m");
    });

    it("rounds correctly", () => {
      expect(formatHours(1.25)).toBe("1h 15m");
    });
  });
});
