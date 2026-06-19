import { catalog } from "../content/catalog";
import type { LifeLogEntry, LifeState, Locale } from "../domain/types";
import { contentLabel, formatNumber, ui } from "../i18n";

const stageLabelKeys: Record<LifeState["stage"], Parameters<typeof ui>[1]> = {
  early_childhood: "stageEarlyChildhood",
  childhood: "stageChildhood",
  teen: "stageTeen",
  adult: "stageAdult",
  elder: "stageElder"
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

export function LifeView({
  life,
  error,
  locale,
  onStart,
  onAgeUp
}: {
  life?: LifeState;
  error?: string;
  locale: Locale;
  onStart(): void;
  onAgeUp(): void;
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

      <button
        className="age-button"
        type="button"
        onClick={onAgeUp}
        disabled={!life.alive || Boolean(life.pendingEventId)}
        aria-label={ui(locale, "ageUp")}
      >
        {ui(locale, "ageUp")}
      </button>
    </section>
  );
}
