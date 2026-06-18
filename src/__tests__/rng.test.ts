import { createRng } from "../domain/rng";

describe("createRng", () => {
  it("returns reproducible values for the same seed", () => {
    const a = createRng("life-123");
    const b = createRng("life-123");

    expect([a.next(), a.next(), a.int(1, 10)]).toEqual([b.next(), b.next(), b.int(1, 10)]);
  });

  it("picks weighted entries deterministically", () => {
    const rng = createRng("weighted");
    const result = rng.weighted([
      { value: "common", weight: 10 },
      { value: "rare", weight: 1 }
    ]);

    expect(["common", "rare"]).toContain(result);
  });

  it("returns reproducible weighted values for the same seed", () => {
    const a = createRng("weighted-repro");
    const b = createRng("weighted-repro");
    const items = [
      { value: "common", weight: 10 },
      { value: "rare", weight: 1 },
      { value: "epic", weight: 0.25 }
    ];

    expect([a.weighted(items), a.weighted(items), a.weighted(items)]).toEqual([
      b.weighted(items),
      b.weighted(items),
      b.weighted(items)
    ]);
  });

  it("throws when picking from an empty array", () => {
    expect(() => createRng("empty-pick").pick([])).toThrow(/empty array/i);
  });

  it("throws when weighted entries are empty or all nonpositive", () => {
    expect(() => createRng("empty-weighted").weighted([])).toThrow(/positive total weight/i);
    expect(() =>
      createRng("zero-weighted").weighted([
        { value: "zero", weight: 0 },
        { value: "negative", weight: -1 }
      ])
    ).toThrow(/positive total weight/i);
  });

  it("excludes negative and zero weights from selection", () => {
    const rng = createRng("nonpositive-exclusion");

    for (let i = 0; i < 20; i += 1) {
      expect(
        rng.weighted([
          { value: "zero", weight: 0 },
          { value: "negative", weight: -100 },
          { value: "positive", weight: 1 }
        ])
      ).toBe("positive");
    }
  });

  it("throws when weighted entries include non-finite weights", () => {
    expect(() =>
      createRng("nan-weight").weighted([
        { value: "valid", weight: 1 },
        { value: "nan", weight: Number.NaN }
      ])
    ).toThrow(/finite/i);
    expect(() =>
      createRng("infinite-weight").weighted([
        { value: "valid", weight: 1 },
        { value: "infinite", weight: Number.POSITIVE_INFINITY }
      ])
    ).toThrow(/finite/i);
  });

  it("throws when finite weighted entries overflow the total", () => {
    expect(() =>
      createRng("overflow-weight").weighted([
        { value: "huge-a", weight: Number.MAX_VALUE },
        { value: "huge-b", weight: Number.MAX_VALUE }
      ])
    ).toThrow(/finite.*total weight/i);
  });

  it("throws when int bounds are invalid", () => {
    const rng = createRng("invalid-int");

    expect(() => rng.int(Number.NaN, 3)).toThrow(/finite/i);
    expect(() => rng.int(1.5, 3)).toThrow(/integer/i);
    expect(() => rng.int(5, 3)).toThrow(/min.*max/i);
  });
});
