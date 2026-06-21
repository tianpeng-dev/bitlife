import { catalog } from "../content/catalog";
import { availableP1Activities, type P1ActivityCard, type P1ActivityGroup } from "../domain/p1/activityCatalog";
import type { LifeState, Locale } from "../domain/types";
import { contentLabel, ui, type UiKey } from "../i18n";

const groupLabelKeys: Record<string, UiKey> = {
  mind_body: "groupMindBody",
  relationships: "groupRelationships",
  education_career: "groupEducationCareer",
  health: "groupHealth",
  leisure: "groupLeisure",
  risk: "groupRisk"
};

const p1GroupLabelKeys: Record<P1ActivityGroup, UiKey> = {
  assets: "groupAssets",
  crime: "groupCrime",
  law_prison: "groupLawPrison",
  fame: "groupFame",
  social: "groupSocial",
  pets: "groupPets",
  travel_migration: "groupTravelMigration",
  romance_family: "groupRomanceFamily"
};

function p1StatusLabel(locale: Locale, card: P1ActivityCard): string {
  if (card.reasonKey === "availableAt" && card.availableAtAge !== undefined) {
    return ui(locale, "availableAt", { age: card.availableAtAge });
  }

  return card.cost !== undefined && card.cost > 0 ? ui(locale, "cost", { amount: card.cost }) : ui(locale, "free");
}

export function ActivitiesView({
  life,
  error,
  locale,
  onActivity
}: {
  life?: LifeState;
  error?: string;
  locale: Locale;
  onActivity(activityId: string): void;
}) {
  if (!life) {
    return (
      <section className="panel empty-state">
        <h1>{ui(locale, "activitiesTitle")}</h1>
        <p>{ui(locale, "activitiesEmpty")}</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="view-heading">
        <h1>{ui(locale, "activitiesTitle")}</h1>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="activity-list">
        {catalog.activities.map((activity) => {
          const tooYoung = life.age < activity.minAge;
          const tooOld = activity.maxAge !== undefined && life.age > activity.maxAge;
          const isFreeActivity = activity.cost === undefined || activity.cost <= 0;
          const doneThisYear = isFreeActivity && (life.freeActivitiesCompletedThisYear ?? []).includes(activity.id);
          const disabled = !life.alive || Boolean(life.prison?.inPrison) || tooYoung || tooOld || doneThisYear;
          const costLabel = activity.cost ? ui(locale, "cost", { amount: activity.cost }) : ui(locale, "free");

          return (
            <button
              className="panel activity-card"
              key={activity.id}
              type="button"
              onClick={() => onActivity(activity.id)}
              disabled={disabled}
            >
              <span>{ui(locale, groupLabelKeys[activity.group])}</span>
              <strong>{contentLabel(locale, activity.labelKey)}</strong>
              <small>
                {tooYoung
                  ? ui(locale, "availableAt", { age: activity.minAge })
                  : tooOld
                    ? ui(locale, "availableUntil", { age: activity.maxAge ?? activity.minAge })
                  : doneThisYear
                    ? ui(locale, "activityDoneThisYear")
                    : costLabel}
              </small>
            </button>
          );
        })}
        {availableP1Activities(life, catalog).map((card) => {
          const disabled = card.disabled || !life.alive;

          return (
            <button
              className="panel activity-card"
              key={card.id}
              type="button"
              onClick={() => onActivity(card.id)}
              disabled={disabled}
            >
              <span>{ui(locale, p1GroupLabelKeys[card.group])}</span>
              <strong>{contentLabel(locale, card.labelKey)}</strong>
              <small>{p1StatusLabel(locale, card)}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
