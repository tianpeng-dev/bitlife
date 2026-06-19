import { useEffect, useState } from "react";
import { fetchLeaderboard, type LeaderboardRow } from "../api/tombstonesClient";
import { catalog } from "../content/catalog";
import type { Locale } from "../domain/types";
import { contentLabel, ui } from "../i18n";

const deathCauseKeys: Record<string, Parameters<typeof ui>[1]> = {
  old_age: "causeOldAge",
  low_health: "causeLowHealth"
};

function formatTombstoneTag(tag: string, locale: Locale) {
  const achievement = catalog.achievements.find((item) => item.id === tag);
  return achievement ? contentLabel(locale, achievement.labelKey) : tag;
}

export function LeaderboardView({ locale = "zh-CN" }: { locale?: Locale }) {
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
      <h1>{ui(locale, "leaderboardTitle")}</h1>
      {error ? <p role="alert">{ui(locale, "leaderboardFailed")}</p> : null}
      {isLoading ? <p>{ui(locale, "leaderboardLoading")}</p> : null}
      {rows.length === 0 && !error && !isLoading ? <p className="empty-state">{ui(locale, "leaderboardEmpty")}</p> : null}
      {rows.map((row) => (
        <article className="panel" key={row.id}>
          <strong>{row.displayName ?? ui(locale, "anonymousLife")}</strong>
          <p>
            {ui(locale, "deathAge", { age: row.ageAtDeath })} · {ui(locale, "score")} {row.score}
          </p>
          <p>
            {ui(locale, "deathCause")}：
            {deathCauseKeys[row.causeOfDeath] ? ui(locale, deathCauseKeys[row.causeOfDeath]) : row.causeOfDeath}
          </p>
          <div className="tag-row">
            {row.tags.map((tag) => (
              <span key={tag}>{formatTombstoneTag(tag, locale)}</span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
