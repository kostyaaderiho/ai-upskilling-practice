import { describe, expect, it } from "vitest";

import { percent } from "../src/stats";

describe("percent()", () => {
  it("matches the documented examples", () => {
    expect(percent(5, 10)).toBe(50);
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(0, 0)).toBe(0);
    expect(percent(10, 10)).toBe(100);
  });

  it("returns 0 when nothing has been read", () => {
    expect(percent(0, 10)).toBe(0);
  });

  it("returns a half as 50, not as 0.5", () => {
    expect(percent(1, 2)).toBe(50);
  });

  it("scales with the share, not with the count", () => {
    expect(percent(1, 4)).toBe(25);
    expect(percent(3, 4)).toBe(75);
    expect(percent(1, 8)).toBe(12.5);
  });

  it("rounds to one decimal place", () => {
    expect(percent(2, 3)).toBe(66.7);
    expect(percent(1, 6)).toBe(16.7);
  });

  it("gives the same percentage for the same share of different totals", () => {
    expect(percent(1, 1)).toBe(100);
    expect(percent(200, 200)).toBe(100);
    expect(percent(50, 100)).toBe(50);
  });
});
