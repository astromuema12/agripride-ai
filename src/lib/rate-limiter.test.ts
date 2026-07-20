import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./logger", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { checkRateLimit, applyRateLimitHeaders, rateLimitResponse, cleanupStores } from "./rate-limiter";

function makeRequest(path: string, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost:3000${path}`, { headers });
}

describe("rate-limiter", () => {
  beforeEach(() => {
    cleanupStores();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  describe("checkRateLimit", () => {
    it("allows first request", () => {
      const req = makeRequest("/api/data", { "x-forwarded-for": "1.2.3.4" });
      const result = checkRateLimit(req);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(59);
      expect(result.limit).toBe(60);
    });

    it("blocks after exceeding limit", () => {
      const req = makeRequest("/api/data", { "x-forwarded-for": "1.2.3.4" });
      for (let i = 0; i < 60; i++) {
        checkRateLimit(req);
      }
      const result = checkRateLimit(req);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("resets after window expires", () => {
      const req = makeRequest("/api/data", { "x-forwarded-for": "1.2.3.4" });
      for (let i = 0; i < 61; i++) {
        checkRateLimit(req);
      }
      vi.setSystemTime(new Date("2025-01-01T00:01:01Z"));
      const result = checkRateLimit(req);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(59);
    });

    it("uses auth tier for /api/auth/ paths", () => {
      const req = makeRequest("/api/auth/login", { "x-forwarded-for": "1.2.3.4" });
      for (let i = 0; i < 10; i++) {
        checkRateLimit(req);
      }
      const result = checkRateLimit(req);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(10);
    });

    it("uses ai tier for /api/ai/ paths", () => {
      const req = makeRequest("/api/ai/chat", { "x-forwarded-for": "1.2.3.4" });
      for (let i = 0; i < 20; i++) {
        checkRateLimit(req);
      }
      const result = checkRateLimit(req);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(20);
    });

    it("uses upload tier for /api/upload paths", () => {
      const req = makeRequest("/api/upload", { "x-forwarded-for": "1.2.3.4" });
      for (let i = 0; i < 5; i++) {
        checkRateLimit(req);
      }
      const result = checkRateLimit(req);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(5);
    });

    it("uses global tier for non-api paths", () => {
      const req = makeRequest("/some-page", { "x-forwarded-for": "1.2.3.4" });
      for (let i = 0; i < 100; i++) {
        checkRateLimit(req);
      }
      const result = checkRateLimit(req);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(100);
    });

    it("keys by userId when provided", () => {
      const req = makeRequest("/api/data", { "x-forwarded-for": "1.2.3.4" });
      for (let i = 0; i < 60; i++) {
        checkRateLimit(req, "user-1");
      }
      const result = checkRateLimit(req, "user-2");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(59);
    });

    it("falls back to IP when no userId", () => {
      const req1 = makeRequest("/api/data", { "x-forwarded-for": "1.2.3.4" });
      const req2 = makeRequest("/api/data", { "x-forwarded-for": "5.6.7.8" });
      for (let i = 0; i < 60; i++) {
        checkRateLimit(req1);
      }
      const result = checkRateLimit(req2);
      expect(result.allowed).toBe(true);
    });

    it("uses x-real-ip when x-forwarded-for absent", () => {
      const req = makeRequest("/api/data", { "x-real-ip": "10.0.0.1" });
      const result = checkRateLimit(req);
      expect(result.allowed).toBe(true);
    });

    it("uses unknown when no IP headers", () => {
      const req = makeRequest("/api/data");
      const result = checkRateLimit(req);
      expect(result.allowed).toBe(true);
    });
  });

  describe("applyRateLimitHeaders", () => {
    it("sets correct headers", () => {
      const headers = new Headers();
      applyRateLimitHeaders(headers, {
        allowed: true,
        limit: 60,
        remaining: 45,
        resetMs: 30000,
      });
      expect(headers.get("X-RateLimit-Limit")).toBe("60");
      expect(headers.get("X-RateLimit-Remaining")).toBe("45");
      expect(headers.get("X-RateLimit-Reset")).toBe("30");
    });
  });

  describe("rateLimitResponse", () => {
    it("returns 429 with correct body and headers", () => {
      const res = rateLimitResponse({
        allowed: false,
        limit: 60,
        remaining: 0,
        resetMs: 45000,
      });
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("45");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  describe("cleanupStores", () => {
    it("runs without error", () => {
      const req = makeRequest("/api/data", { "x-forwarded-for": "1.2.3.4" });
      checkRateLimit(req);
      expect(() => cleanupStores()).not.toThrow();
    });
  });
});
