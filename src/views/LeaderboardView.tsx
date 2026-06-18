import { useEffect, useState } from "react";
import { fetchLeaderboard, type LeaderboardRow } from "../api/tombstonesClient";
import { catalog } from "../content/catalog";

const deathCauseLabels: Record<string, string> = {
  old_age: "自然老去",
  low_health: "健康衰竭"
};

function formatTombstoneTag(tag: string) {
  const achievement = catalog.achievements.find((item) => item.id === tag);
  return achievement ? catalog.locales["zh-CN"][achievement.labelKey] : tag;
}

export function LeaderboardView() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchLeaderboard()
      .then((items) => {
        if (active) {
          setRows(items);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="stack">
      <h1>排行榜</h1>
      {error ? <p role="alert">排行榜加载失败。</p> : null}
      {isLoading ? <p>排行榜加载中...</p> : null}
      {rows.length === 0 && !error && !isLoading ? <p className="empty-state">还没有匿名墓碑。</p> : null}
      {rows.map((row) => (
        <article className="panel" key={row.id}>
          <strong>{row.displayName ?? "匿名人生"}</strong>
          <p>
            享年 {row.ageAtDeath} · 分数 {row.score}
          </p>
          <p>死因：{deathCauseLabels[row.causeOfDeath] ?? row.causeOfDeath}</p>
          <div className="tag-row">
            {row.tags.map((tag) => (
              <span key={tag}>{formatTombstoneTag(tag)}</span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
