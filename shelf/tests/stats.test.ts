import { describe, expect, it } from "vitest";

import { percent } from "../src/stats";

describe("percent", () => {
  it("returns 0 when there are no books at all", () => {
    expect(percent(0, 0)).toBe(0);
  });

  it("returns 0 when nothing is read yet", () => {
    expect(percent(0, 10)).toBe(0);
  });

  it("returns 100 when everything is read", () => {
    expect(percent(10, 10)).toBe(100);
  });

  it("returns 50 for half of the shelf", () => {
    expect(percent(5, 10)).toBe(50);
  });

  it("works for a single book", () => {
    expect(percent(1, 1)).toBe(100);
    expect(percent(0, 1)).toBe(0);
  });

  it("does not depend on the size of the shelf for the same ratio", () => {
    expect(percent(1, 2)).toBe(50);
    expect(percent(50, 100)).toBe(50);
    expect(percent(500, 1000)).toBe(50);
  });

  it("rounds to one decimal place", () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(2, 3)).toBe(66.7);
    expect(percent(1, 6)).toBe(16.7);
    expect(percent(1, 8)).toBe(12.5);
  });

  it("stays within 0..100 for a realistic shelf", () => {
    for (const [read, total] of [
      [0, 7],
      [3, 7],
      [7, 7],
      [13, 40],
    ]) {
      const value = percent(read, total);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});
