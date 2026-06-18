import { clampStat, clampCash, clampRelationship } from "../domain/clamp";

describe("domain bounds", () => {
  it("keeps stats between 0 and 100", () => {
    expect(clampStat(-20)).toBe(0);
    expect(clampStat(42)).toBe(42);
    expect(clampStat(140)).toBe(100);
  });

  it("allows cash debt but keeps invalid numbers at zero", () => {
    expect(clampCash(Number.NaN)).toBe(0);
    expect(clampCash(-500)).toBe(-500);
    expect(clampCash(2500)).toBe(2500);
  });

  it("keeps relationships between 0 and 100", () => {
    expect(clampRelationship(-20)).toBe(0);
    expect(clampRelationship(42)).toBe(42);
    expect(clampRelationship(140)).toBe(100);
  });
});
