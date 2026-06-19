import { useGameStore } from "../store/gameStore";

describe("gameStore", () => {
  beforeEach(() => {
    useGameStore.getState().resetForTest();
  });

  it("starts a new life", () => {
    useGameStore.getState().startNewLife("store-seed");

    const life = useGameStore.getState().life;
    expect(life?.seed).toBe("store-seed");
    expect(life?.age).toBe(0);
  });

  it("advances a life", () => {
    useGameStore.getState().startNewLife("advance-store");
    useGameStore.getState().advanceYear();

    expect(useGameStore.getState().life?.age).toBe(1);
  });
});
