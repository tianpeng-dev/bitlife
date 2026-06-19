import { render, screen } from "@testing-library/react";
import { LeaderboardView } from "../views/LeaderboardView";

describe("LeaderboardView", () => {
  it("renders remote rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              rows: [
                {
                  id: "one",
                  displayName: "匿名人生",
                  ageAtDeath: 88,
                  score: 1234,
                  tags: ["long_life"],
                  causeOfDeath: "old_age"
                }
              ]
            }),
            { status: 200 }
          )
      )
    );

    render(<LeaderboardView />);

    expect(await screen.findByText("匿名人生")).toBeInTheDocument();
    expect(screen.getByText(/1234/)).toBeInTheDocument();
  });
});
