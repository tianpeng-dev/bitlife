import { render, screen } from "@testing-library/react";
import { fetchLeaderboard } from "../api/tombstonesClient";
import { LeaderboardView } from "../views/LeaderboardView";

function stubLeaderboardResponse(body: unknown, init: ResponseInit = { status: 200 }) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), init)));
}

describe("fetchLeaderboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects malformed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{", { status: 200 })));

    await expect(fetchLeaderboard()).rejects.toThrow("Invalid leaderboard response");
  });

  it.each([
    { rows: undefined },
    { rows: "nope" },
    { rows: [{ id: "", ageAtDeath: 88, score: 1234, tags: ["long_life"], causeOfDeath: "old_age" }] },
    { rows: [{ id: "one", ageAtDeath: Number.NaN, score: 1234, tags: ["long_life"], causeOfDeath: "old_age" }] },
    { rows: [{ id: "one", ageAtDeath: 88, score: Infinity, tags: ["long_life"], causeOfDeath: "old_age" }] },
    { rows: [{ id: "one", ageAtDeath: 88, score: 1234, tags: [123], causeOfDeath: "old_age" }] },
    { rows: [{ id: "one", ageAtDeath: 88, score: 1234, tags: ["long_life"], causeOfDeath: 123 }] },
    {
      rows: [
        {
          id: "one",
          displayName: 123,
          ageAtDeath: 88,
          score: 1234,
          tags: ["long_life"],
          causeOfDeath: "old_age"
        }
      ]
    }
  ])("rejects an invalid leaderboard response from %o", async (body) => {
    stubLeaderboardResponse(body);

    await expect(fetchLeaderboard()).rejects.toThrow("Invalid leaderboard response");
  });
});

describe("LeaderboardView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a loading state while rows are in flight", async () => {
    let resolveFetch: (response: Response) => void = () => {};
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal("fetch", vi.fn(() => fetchPromise));

    render(<LeaderboardView />);

    expect(screen.getByText("排行榜加载中...")).toBeInTheDocument();

    resolveFetch(new Response(JSON.stringify({ rows: [] }), { status: 200 }));
    expect(await screen.findByText("还没有匿名墓碑。")).toBeInTheDocument();
  });

  it("shows the empty state after a successful empty response", async () => {
    stubLeaderboardResponse({ rows: [] });

    render(<LeaderboardView />);

    expect(await screen.findByText("还没有匿名墓碑。")).toBeInTheDocument();
    expect(screen.queryByText("排行榜加载中...")).not.toBeInTheDocument();
  });

  it("shows an alert when the API returns a non-OK response", async () => {
    stubLeaderboardResponse({ error: "Nope" }, { status: 500 });

    render(<LeaderboardView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("排行榜加载失败。");
    expect(screen.queryByText("还没有匿名墓碑。")).not.toBeInTheDocument();
  });

  it("shows an alert when the response shape is invalid", async () => {
    stubLeaderboardResponse({ rows: [{ id: "one" }] });

    render(<LeaderboardView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("排行榜加载失败。");
  });

  it("renders remote rows with localized death causes and tags", async () => {
    stubLeaderboardResponse({
      rows: [
        {
          id: "one",
          displayName: "匿名人生",
          ageAtDeath: 88,
          score: 1234,
          tags: ["long_life", "unknown_tag"],
          causeOfDeath: "old_age"
        }
      ]
    });

    render(<LeaderboardView />);

    expect(await screen.findByText("匿名人生")).toBeInTheDocument();
    expect(screen.getByText(/1234/)).toBeInTheDocument();
    expect(screen.getByText("死因：自然老去")).toBeInTheDocument();
    expect(screen.getByText("长寿人生")).toBeInTheDocument();
    expect(screen.getByText("unknown_tag")).toBeInTheDocument();
  });
});
