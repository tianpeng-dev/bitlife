import { useEffect, useState } from "react";
import { StatBar } from "./components/StatBar";
import { catalog } from "./content/catalog";
import type { LifeState, Locale, StatKey } from "./domain/types";
import { contentLabel, formatNumber, signed, ui } from "./i18n";
import { useGameStore, type ActionFeedback, type FeedbackEntry, type SelectedView } from "./store/gameStore";
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

const deathCauseKeys: Record<string, Parameters<typeof ui>[1]> = {
  old_age: "causeOldAge",
  low_health: "causeLowHealth"
};

function feedbackText(locale: Locale, entry: FeedbackEntry): string {
  if (entry.type === "stat") {
    return `${ui(locale, statLabelKeys[entry.stat])} ${signed(entry.delta)}`;
  }
  if (entry.type === "cash") {
    return ui(locale, "effectCash", { delta: signed(entry.delta) });
  }
  if (entry.type === "relationship") {
    return ui(locale, "effectRelationship", { delta: signed(entry.delta) });
  }
  if (entry.type === "disease") {
    const disease = catalog.diseases.find((item) => item.id === entry.diseaseId);
    return ui(locale, "effectDisease", { name: disease ? contentLabel(locale, disease.nameKey) : entry.diseaseId });
  }
  return ui(locale, "effectDeath", {
    cause: deathCauseKeys[entry.causeOfDeath] ? ui(locale, deathCauseKeys[entry.causeOfDeath]) : entry.causeOfDeath
  });
}

function FeedbackPanel({ feedback, locale }: { feedback?: ActionFeedback; locale: Locale }) {
  if (!feedback) return null;

  return (
    <section className="feedback-panel" role="status" aria-live="polite">
      <strong>{ui(locale, feedback.source === "choice" ? "choiceFeedbackTitle" : "activityFeedbackTitle")}</strong>
      {feedback.entries.length > 0 ? (
        <ul>
          {feedback.entries.map((entry, index) => (
            <li key={`${entry.type}-${index}`}>{feedbackText(locale, entry)}</li>
          ))}
        </ul>
      ) : (
        <p>{locale === "zh-CN" ? "没有明显变化。" : "No visible change."}</p>
      )}
    </section>
  );
}

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
  const life = useGameStore((state) => state.life);
  const selectedView = useGameStore((state) => state.selectedView);
  const lastFeedback = useGameStore((state) => state.lastFeedback);
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
            <span>{ui(locale, "appTitle")}</span>
            <strong>{ui(locale, "appSubtitle")}</strong>
          </div>
          <div className="top-actions">
            <button type="button" onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}>
              {ui(locale, "languageToggle")}
            </button>
            <span className="status-pill">{life ? ui(locale, "ageStatus", { age: life.age }) : ui(locale, "newGameStatus")}</span>
          </div>
        </header>

        <div className="screen">
          <FeedbackPanel feedback={lastFeedback} locale={locale} />
          {activeView === "life" ? (
            <LifeView
              life={life}
              error={error}
              locale={locale}
              onStart={handleStart}
              onAgeUp={advanceYear}
              onChoose={chooseEvent}
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
        <StatusDock life={life} locale={locale} />
      </div>
    </main>
  );
}
