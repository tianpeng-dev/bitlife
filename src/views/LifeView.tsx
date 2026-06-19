import { catalog } from "../content/catalog";
import type { LifeLogEntry, LifeState, Locale } from "../domain/types";
import { contentLabel, formatNumber, signed, ui } from "../i18n";
import type { ActionFeedback, FeedbackEntry } from "../store/gameStore";

const statLabelKeys: Record<keyof LifeState["stats"], Parameters<typeof ui>[1]> = {
  happiness: "statHappiness",
  health: "statHealth",
  smarts: "statSmarts",
  looks: "statLooks"
};

const deathCauseKeys: Record<string, Parameters<typeof ui>[1]> = {
  old_age: "causeOldAge",
  low_health: "causeLowHealth"
};

function formatLog(entry: LifeLogEntry, locale: Locale): string {
  const base = contentLabel(locale, entry.messageKey);
  if (entry.messageKey === "log.age_up" && typeof entry.params?.age === "number") {
    return locale === "zh-CN" ? `${base} 年满 ${entry.params.age} 岁` : `${base} Age ${entry.params.age}`;
  }
  if (entry.messageKey === "log.activity" && typeof entry.params?.activityId === "string") {
    const activity = catalog.activities.find((item) => item.id === entry.params?.activityId);
    return activity ? `${base} ${contentLabel(locale, activity.labelKey)}` : base;
  }
  if (entry.messageKey === "log.choice_resolved" && typeof entry.params?.eventId === "string") {
    const event = catalog.events.find((item) => item.id === entry.params?.eventId);
    return event ? `${base} ${contentLabel(locale, event.promptKey)}` : base;
  }
  return base;
}

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

export function LifeView({
  life,
  error,
  locale,
  onStart,
  feedback
}: {
  life?: LifeState;
  error?: string;
  locale: Locale;
  onStart(): void;
  feedback?: ActionFeedback;
}) {
  if (!life) {
    return (
      <section className="hero stack">
        <div className="hero__masthead">
          <span className="hero__eyebrow">{ui(locale, "appTitle")}</span>
          <h1>{ui(locale, "heroTitle")}</h1>
          <p>{ui(locale, "heroCopy")}</p>
        </div>
        <button className="primary-button" type="button" onClick={onStart}>
          {ui(locale, "startLife")}
        </button>
      </section>
    );
  }

  const recentLogs = [...life.log].slice(-5).reverse();
  const country = catalog.countries.find((item) => item.id === life.countryId);
  const countryName = country ? contentLabel(locale, country.nameKey) : life.countryId;

  return (
    <section className="life-view stack">
      <header className="life-card">
        <div className="life-card__identity">
          <span>{life.alive ? ui(locale, "currentLife") : ui(locale, "lifeEnded")}</span>
          <strong>{life.name}</strong>
        </div>
        <div className="life-card__meta">
          <span>{ui(locale, "ageStatus", { age: life.age })}</span>
          <span>{countryName}</span>
          <span>${formatNumber(locale, life.cash)}</span>
        </div>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="panel life-log-panel">
        <div className="panel-heading">
          <h2>{ui(locale, "lifeLog")}</h2>
          <span>{life.log.length}</span>
        </div>
        <ol className="log-list">
          {feedback ? (
            <li className="log-feedback-entry" aria-live="polite">
              <span>{ui(locale, "ageStatus", { age: life.age })}</span>
              <p>
                <strong>{ui(locale, feedback.source === "choice" ? "choiceFeedbackTitle" : "activityFeedbackTitle")}</strong>
              </p>
              <div className="log-effect-list">
                {feedback.entries.length > 0 ? (
                  feedback.entries.map((entry, index) => (
                    <small key={`${entry.type}-${index}`}>{feedbackText(locale, entry)}</small>
                  ))
                ) : (
                  <small>{ui(locale, "noVisibleChange")}</small>
                )}
              </div>
            </li>
          ) : null}
          {recentLogs.map((entry) => (
            <li key={entry.id}>
              <span>{ui(locale, "ageStatus", { age: entry.age })}</span>
              <p>{formatLog(entry, locale)}</p>
            </li>
          ))}
        </ol>
      </section>

      {!life.pendingEventId ? (
        <section className="panel empty-state">
          <p>{ui(locale, "noEvent")}</p>
        </section>
      ) : null}
    </section>
  );
}
