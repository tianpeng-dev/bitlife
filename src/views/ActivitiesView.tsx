import { catalog } from "../content/catalog";
import type { LifeState, Locale } from "../domain/types";
import { contentLabel, ui } from "../i18n";

const groupLabelKeys: Record<string, Parameters<typeof ui>[1]> = {
  mind_body: "groupMindBody",
  relationships: "groupRelationships",
  education_career: "groupEducationCareer",
  health: "groupHealth",
  leisure: "groupLeisure",
  risk: "groupRisk"
};

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
          const ageLocked =
            life.age < activity.minAge || (activity.maxAge !== undefined && life.age > activity.maxAge);
          const isFreeActivity = activity.cost === undefined || activity.cost <= 0;
          const doneThisYear = isFreeActivity && (life.freeActivitiesCompletedThisYear ?? []).includes(activity.id);
          const disabled = !life.alive || ageLocked || doneThisYear;
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
                {ageLocked
                  ? ui(locale, "availableAt", { age: activity.minAge })
                  : doneThisYear
                    ? ui(locale, "activityDoneThisYear")
                    : costLabel}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
