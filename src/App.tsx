import { useEffect } from "react";
import { useGameStore, type SelectedView } from "./store/gameStore";
import { ActivitiesView } from "./views/ActivitiesView";
import { CareerView } from "./views/CareerView";
import { LeaderboardView } from "./views/LeaderboardView";
import { LifeView } from "./views/LifeView";
import { RelationshipsView } from "./views/RelationshipsView";
import { TombstoneView } from "./views/TombstoneView";

const navItems: Array<{ view: SelectedView; label: string }> = [
  { view: "life", label: "人生" },
  { view: "activities", label: "活动" },
  { view: "relationships", label: "关系" },
  { view: "career", label: "职业" },
  { view: "leaderboard", label: "排行" }
];

export function App() {
  const life = useGameStore((state) => state.life);
  const selectedView = useGameStore((state) => state.selectedView);
  const error = useGameStore((state) => state.error);
  const startNewLife = useGameStore((state) => state.startNewLife);
  const advanceYear = useGameStore((state) => state.advanceYear);
  const chooseEvent = useGameStore((state) => state.chooseEvent);
  const doActivity = useGameStore((state) => state.doActivity);
  const setView = useGameStore((state) => state.setView);
  const hydrateActiveLife = useGameStore((state) => state.hydrateActiveLife);

  useEffect(() => {
    void hydrateActiveLife();
  }, [hydrateActiveLife]);

  const handleStart = () => {
    startNewLife(`life-${Date.now()}`);
  };

  const activeView: SelectedView =
    life?.death && (selectedView === "life" || selectedView === "tombstone") ? "tombstone" : selectedView;

  return (
    <main className="app-shell">
      <div className="app-frame">
        <header className="top-bar">
          <div>
            <span>Text Life</span>
            <strong>人生模拟器</strong>
          </div>
          <span className="status-pill">{life ? `${life.age}岁` : "新局"}</span>
        </header>

        <div className="screen">
          {activeView === "life" ? (
            <LifeView
              life={life}
              error={error}
              onStart={handleStart}
              onAgeUp={advanceYear}
              onChoose={chooseEvent}
            />
          ) : null}
          {activeView === "activities" ? (
            <ActivitiesView life={life} error={error} onActivity={doActivity} />
          ) : null}
          {activeView === "relationships" ? <RelationshipsView life={life} /> : null}
          {activeView === "career" ? <CareerView life={life} /> : null}
          {activeView === "tombstone" ? <TombstoneView life={life} onStart={handleStart} /> : null}
          {activeView === "leaderboard" ? <LeaderboardView /> : null}
        </div>

        <nav className="bottom-nav" aria-label="主菜单">
          {navItems.map((item) => {
            const isCurrent = activeView === item.view || (activeView === "tombstone" && item.view === "life");
            const nextView = life?.death && item.view === "life" ? "tombstone" : item.view;

            return (
              <button
                key={item.view}
                className={isCurrent ? "active" : undefined}
                type="button"
                onClick={() => setView(nextView)}
                aria-current={isCurrent ? "page" : undefined}
              >
                {life?.death && item.view === "life" ? "墓碑" : item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
