import { submitTombstone } from "../api/tombstonesClient";

const payload = {
  seed: "seed",
  ageAtDeath: 90,
  causeOfDeath: "old_age",
  summary: "A quiet life.",
  tags: ["long_life"],
  score: 1200,
  stats: { happiness: 50, health: 0, smarts: 80, looks: 40 },
  netWorth: 5000,
  careerTitle: "writer",
  highestEducation: "graduated"
};

describe("tombstonesClient", () => {
  it("posts a tombstone and returns a share id", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ shareId: "abc123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitTombstone(payload);

    expect(result.shareId).toBe("abc123");
    expect(fetchMock).toHaveBeenCalledWith("/api/tombstones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("rejects non-OK responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Nope" }), { status: 500 })));

    await expect(submitTombstone(payload)).rejects.toThrow("Tombstone submit failed: 500");
  });

  it.each([{ shareId: "" }, { shareId: 123 }, {}])("rejects an invalid share id from %o", async (body) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })));

    await expect(submitTombstone(payload)).rejects.toThrow("Invalid tombstone response");
  });

  it("rejects malformed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{", { status: 200 })));

    await expect(submitTombstone(payload)).rejects.toThrow("Invalid tombstone response");
  });
});
