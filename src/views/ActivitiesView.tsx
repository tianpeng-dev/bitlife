import { catalog } from "../content/catalog";
import type { LifeState } from "../domain/types";

const groupLabels: Record<string, string> = {
  mind_body: "身心",
  relationships: "关系",
  education_career: "学习与职业",
  health: "健康",
  leisure: "休闲",
  risk: "风险"
};

export function ActivitiesView({
  life,
  error,
  onActivity
}: {
  life?: LifeState;
  error?: string;
  onActivity(activityId: string): void;
}) {
  const zh = catalog.locales["zh-CN"];

  if (!life) {
    return (
      <section className="panel empty-state">
        <h1>活动</h1>
        <p>先开始一段人生，再安排学习、健康、社交和工作。</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="view-heading">
        <h1>活动</h1>
        <p>{life.pendingEventId ? "先处理当前事件，之后再安排活动。" : "每项活动会改变属性、金钱或关系。"}</p>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="activity-list">
        {catalog.activities.map((activity) => {
          const ageLocked =
            life.age < activity.minAge || (activity.maxAge !== undefined && life.age > activity.maxAge);
          const disabled = !life.alive || Boolean(life.pendingEventId) || ageLocked;
          const costLabel = activity.cost ? `花费 $${activity.cost}` : "免费";

          return (
            <button
              className="panel activity-card"
              key={activity.id}
              type="button"
              onClick={() => onActivity(activity.id)}
              disabled={disabled}
            >
              <span>{groupLabels[activity.group]}</span>
              <strong>{zh[activity.labelKey]}</strong>
              <small>{ageLocked ? `${activity.minAge}岁后可用` : costLabel}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
