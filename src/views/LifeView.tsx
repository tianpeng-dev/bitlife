import { EventPanel } from "../components/EventPanel";
import { StatBar } from "../components/StatBar";
import { catalog } from "../content/catalog";
import type { LifeLogEntry, LifeState } from "../domain/types";

const statLabels: Array<[keyof LifeState["stats"], string]> = [
  ["happiness", "快乐"],
  ["health", "健康"],
  ["smarts", "智力"],
  ["looks", "颜值"]
];

const stageLabels: Record<LifeState["stage"], string> = {
  early_childhood: "幼年",
  childhood: "童年",
  teen: "青少年",
  adult: "成年",
  elder: "老年"
};

function formatLog(entry: LifeLogEntry): string {
  const zh = catalog.locales["zh-CN"];
  const base = zh[entry.messageKey] ?? entry.messageKey;
  if (entry.messageKey === "log.age_up" && typeof entry.params?.age === "number") {
    return `${base} 年满 ${entry.params.age} 岁`;
  }
  if (entry.messageKey === "log.activity" && typeof entry.params?.activityId === "string") {
    const activity = catalog.activities.find((item) => item.id === entry.params?.activityId);
    return activity ? `${base} ${zh[activity.labelKey]}` : base;
  }
  if (entry.messageKey === "log.choice_resolved" && typeof entry.params?.eventId === "string") {
    const event = catalog.events.find((item) => item.id === entry.params?.eventId);
    return event ? `${base} ${zh[event.promptKey]}` : base;
  }
  return base;
}

export function LifeView({
  life,
  error,
  onStart,
  onAgeUp,
  onChoose
}: {
  life?: LifeState;
  error?: string;
  onStart(): void;
  onAgeUp(): void;
  onChoose(choiceId: string): void;
}) {
  if (!life) {
    return (
      <section className="hero stack">
        <div className="hero__masthead">
          <span className="hero__eyebrow">Text Life</span>
          <h1>把一生装进口袋</h1>
          <p>
            从出生开始推进年龄，处理事件、经营关系、选择活动，看看这一次会活成怎样的人。
          </p>
        </div>
        <button className="primary-button" type="button" onClick={onStart}>
          开始新人生
        </button>
      </section>
    );
  }

  const recentLogs = [...life.log].slice(-5).reverse();
  const country = catalog.countries.find((item) => item.id === life.countryId);
  const countryName = country ? catalog.locales["zh-CN"][country.nameKey] : life.countryId;

  return (
    <section className="life-view stack">
      <header className="life-card panel">
        <div>
          <span className="kicker">{life.alive ? "当前人生" : "人生已结束"}</span>
          <h1>{life.name}</h1>
          <p>年龄：{life.age}</p>
        </div>
        <div className="tag-row">
          <span>{countryName}</span>
          <span>{life.city}</span>
          <span>${life.cash.toLocaleString("zh-CN")}</span>
        </div>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="panel">
        <div className="panel-heading">
          <h2>状态</h2>
          <span>{stageLabels[life.stage]}</span>
        </div>
        <div className="stats-grid">
          {statLabels.map(([key, label]) => (
            <StatBar key={key} label={label} value={life.stats[key]} />
          ))}
        </div>
      </section>

      {life.pendingEventId ? (
        <EventPanel eventId={life.pendingEventId} onChoose={onChoose} />
      ) : (
        <section className="panel empty-state">
          <p>这一年没有未处理事件。准备好就长大一岁。</p>
        </section>
      )}

      <section className="panel">
        <div className="panel-heading">
          <h2>人生记录</h2>
          <span>{life.log.length} 条</span>
        </div>
        <ol className="log-list">
          {recentLogs.map((entry) => (
            <li key={entry.id}>
              <span>{entry.age}岁</span>
              <p>{formatLog(entry)}</p>
            </li>
          ))}
        </ol>
      </section>

      <button
        className="age-button"
        type="button"
        onClick={onAgeUp}
        disabled={!life.alive || Boolean(life.pendingEventId)}
      >
        年龄+1
      </button>
    </section>
  );
}
