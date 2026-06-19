import { useEffect, useState } from "react";
import { EventPanel } from "./components/EventPanel";
import { StatBar } from "./components/StatBar";
import type { LifeState, Locale, StatKey } from "./domain/types";
import { formatNumber, ui } from "./i18n";
import { useGameStore, type SelectedView } from "./store/gameStore";
import { ActivitiesView } from "./views/ActivitiesView";
import { CareerView } from "./views/CareerView";
import { LeaderboardView } from "./views/LeaderboardView";
import { LifeView } from "./views/LifeView";
import { RelationshipsView } from "./views/RelationshipsView";
import { TombstoneView } from "./views/TombstoneView";

const navItems: Array<{ view: SelectedView; labelKey: Parameters<typeof ui>[1] }> = [
  { view: "life", labelKey: "navLife" },
  { view: "activities", labelKey: "navActivities" },
  { view: "relationships", labelKey: "navRelationships" },
  { view: "career", labelKey: "navCareer" },
  { view: "leaderboard", labelKey: "navLeaderboard" }
];

const statLabelKeys: Record<StatKey, Parameters<typeof ui>[1]> = {
  happiness: "statHappiness",
  health: "statHealth",
  smarts: "statSmarts",
  looks: "statLooks"
};

function StatusDock({ life, locale }: { life?: LifeState; locale: Locale }) {
  if (!life) return null;

  return (
    <section className="status-dock" aria-label={ui(locale, "statsTitle")}>
      <div className="status-dock__meta">
        <strong>{life.name}</strong>
        <span>
          {ui(locale, "ageStatus", { age: life.age })} · {ui(locale, "cashLabel")} $
          {formatNumber(locale, life.cash)}
        </span>
      </div>
      <div className="stats-grid">
        {(Object.keys(statLabelKeys) as StatKey[]).map((key) => (
          <StatBar key={key} label={ui(locale, statLabelKeys[key])} value={life.stats[key]} />
        ))}
      </div>
    </section>
  );
}

export function App() {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showStatusDock, setShowStatusDock] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const life = useGameStore((state) => state.life);
  const selectedView = useGameStore((state) => state.selectedView);
  const lastFeedback = useGameStore((state) => state.lastFeedback);
  const error = useGameStore((state) => state.error);
  const startNewLife = useGameStore((state) => state.startNewLife);
  const exitGame = useGameStore((state) => state.exitGame);
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
    setIsMenuOpen(false);
  };

  const handleExit = () => {
    exitGame();
    setIsMenuOpen(false);
  };

  const activeView: SelectedView =
    life?.death && (selectedView === "life" || selectedView === "tombstone") ? "tombstone" : selectedView;

  return (
    <main className="app-shell">
      <div className="app-frame">
        <header className="top-bar">
          <div className="brand-row">
            <button
              type="button"
              className="menu-button"
              aria-label={ui(locale, "menuLabel")}
              aria-expanded={isMenuOpen}
              aria-controls="main-menu"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
            <div className="brand-copy">
              <span>{ui(locale, "appTitle")}</span>
              <strong>{ui(locale, "appSubtitle")}</strong>
            </div>
          </div>
          <div className="top-actions">
            <button type="button" onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}>
              {ui(locale, "languageToggle")}
            </button>
            <span className="status-pill">{life ? ui(locale, "ageStatus", { age: life.age }) : ui(locale, "newGameStatus")}</span>
          </div>
          {isMenuOpen ? (
            <div id="main-menu" className="main-menu" role="menu" aria-label={ui(locale, "menuTitle")}>
              <div className="main-menu__heading">
                <span>{ui(locale, "menuTitle")}</span>
              </div>
              <button type="button" role="menuitem" onClick={handleStart}>
                <span>{ui(locale, "startLife")}</span>
                <strong>{ui(locale, "newLife")}</strong>
              </button>
              <button type="button" role="menuitem" onClick={handleExit}>
                <span>{ui(locale, "exitGame")}</span>
                <strong>{life ? ui(locale, "ageStatus", { age: life.age }) : ui(locale, "newGameStatus")}</strong>
              </button>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={showStatusDock}
                onClick={() => setShowStatusDock((current) => !current)}
              >
                <span>{ui(locale, "statusDisplay")}</span>
                <strong>{ui(locale, showStatusDock ? "statusVisible" : "statusHidden")}</strong>
              </button>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={soundEnabled}
                onClick={() => setSoundEnabled((current) => !current)}
              >
                <span>{ui(locale, "soundSetting")}</span>
                <strong>{ui(locale, soundEnabled ? "soundOn" : "soundOff")}</strong>
              </button>
            </div>
          ) : null}
        </header>

        <div className="screen">
          {activeView === "life" ? (
            <LifeView
              life={life}
              error={error}
              locale={locale}
              onStart={handleStart}
              onAgeUp={advanceYear}
              feedback={lastFeedback}
            />
          ) : null}
          {activeView === "activities" ? (
            <ActivitiesView life={life} error={error} locale={locale} onActivity={doActivity} />
          ) : null}
          {activeView === "relationships" ? <RelationshipsView life={life} locale={locale} /> : null}
          {activeView === "career" ? <CareerView life={life} locale={locale} /> : null}
          {activeView === "tombstone" ? <TombstoneView life={life} locale={locale} onStart={handleStart} /> : null}
          {activeView === "leaderboard" ? <LeaderboardView locale={locale} /> : null}
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
                {life?.death && item.view === "life" ? ui(locale, "navTombstone") : ui(locale, item.labelKey)}
              </button>
            );
          })}
        </nav>
        {showStatusDock ? <StatusDock life={life} locale={locale} /> : null}
        {activeView === "life" && life?.pendingEventId ? (
          <EventPanel eventId={life.pendingEventId} locale={locale} onChoose={chooseEvent} />
        ) : null}
      </div>
    </main>
  );
}
