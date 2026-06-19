import { useState } from "react";

import { submitTombstone } from "../api/tombstonesClient";
import { catalog } from "../content/catalog";
import type { LifeState, Locale } from "../domain/types";
import { contentLabel, formatNumber, ui } from "../i18n";

const deathCauseKeys: Record<string, Parameters<typeof ui>[1]> = {
  old_age: "causeOldAge",
  low_health: "causeLowHealth"
};

function formatTombstoneTag(tag: string, locale: Locale) {
  const achievement = catalog.achievements.find((item) => item.id === tag);
  return achievement ? contentLabel(locale, achievement.labelKey) : tag;
}

export function TombstoneView({ life, locale, onStart }: { life?: LifeState; locale: Locale; onStart(): void }) {
  const [shareId, setShareId] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!life?.death) {
    return (
      <section className="panel empty-state tombstone">
        <h1>{ui(locale, "tombstoneTitle")}</h1>
        <p>{ui(locale, "tombstoneEmpty")}</p>
        <button className="primary-button" type="button" onClick={onStart}>
          {ui(locale, "startLife")}
        </button>
      </section>
    );
  }

  async function handleSubmit() {
    if (!life?.death) {
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    try {
      const result = await submitTombstone({
        seed: life.seed,
        ageAtDeath: life.death.ageAtDeath,
        causeOfDeath: life.death.causeOfDeath,
        summary: contentLabel(locale, life.death.summaryKey),
        tags: life.death.tags,
        score: life.death.score,
        stats: life.stats,
        netWorth: life.death.netWorth,
        careerTitle: life.career.title,
        highestEducation: life.education.stage,
        displayName: life.name
      });
      setShareId(result.shareId);
    } catch {
      setError(ui(locale, "submitFailed"));
      alert(ui(locale, "submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel tombstone">
      <span>R.I.P.</span>
      <h1>{life.name}</h1>
      <p>{ui(locale, "deathAge", { age: life.death.ageAtDeath })}</p>
      <dl>
        <div>
          <dt>{ui(locale, "deathCause")}</dt>
          <dd>
            {deathCauseKeys[life.death.causeOfDeath]
              ? ui(locale, deathCauseKeys[life.death.causeOfDeath])
              : life.death.causeOfDeath}
          </dd>
        </div>
        <div>
          <dt>{ui(locale, "netWorth")}</dt>
          <dd>${formatNumber(locale, life.death.netWorth)}</dd>
        </div>
        <div>
          <dt>{ui(locale, "score")}</dt>
          <dd>{life.death.score}</dd>
        </div>
      </dl>
      <div className="tag-row">
        {life.death.tags.map((tag) => (
          <span key={tag}>{formatTombstoneTag(tag, locale)}</span>
        ))}
      </div>
      {shareId ? <p>{ui(locale, "shareId", { id: shareId })}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <div className="button-row">
        <button type="button" disabled={isSubmitting || Boolean(shareId)} onClick={handleSubmit}>
          {isSubmitting ? ui(locale, "submitting") : ui(locale, "submitAnonymous")}
        </button>
        <button className="primary-button" type="button" onClick={onStart}>
          {ui(locale, "startLife")}
        </button>
      </div>
    </section>
  );
}
