import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows first request", () => {
    const result = rateLimit("test-ip-1", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows up to max attempts", () => {
    const ip = "test-ip-2";
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(ip, 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks after max attempts", () => {
    const ip = "test-ip-3";
    for (let i = 0; i < 5; i++) {
      rateLimit(ip, 5, 60_000);
    }
    const result = rateLimit(ip, 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("uses separate counters per IP", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("blocked-ip", 5, 60_000);
    }
    const blocked = rateLimit("blocked-ip", 5, 60_000);
    expect(blocked.allowed).toBe(false);

    const allowed = rateLimit("other-ip", 5, 60_000);
    expect(allowed.allowed).toBe(true);
  });
});
