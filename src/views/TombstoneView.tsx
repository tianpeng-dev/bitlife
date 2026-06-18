import { useState } from "react";

import { submitTombstone } from "../api/tombstonesClient";
import { catalog } from "../content/catalog";
import type { LifeState } from "../domain/types";

const deathCauseLabels: Record<string, string> = {
  old_age: "自然老去",
  low_health: "健康衰竭"
};

function formatTombstoneTag(tag: string) {
  const achievement = catalog.achievements.find((item) => item.id === tag);
  return achievement ? catalog.locales["zh-CN"][achievement.labelKey] : tag;
}

export function TombstoneView({ life, onStart }: { life?: LifeState; onStart(): void }) {
  const [shareId, setShareId] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!life?.death) {
    return (
      <section className="panel empty-state tombstone">
        <h1>墓碑</h1>
        <p>人生结束后，这里会显示总结。</p>
        <button className="primary-button" type="button" onClick={onStart}>
          开始新人生
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
        summary: catalog.locales["zh-CN"][life.death.summaryKey] ?? life.death.summaryKey,
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
      setError("提交失败，请稍后重试。");
      alert("提交失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel tombstone">
      <span>R.I.P.</span>
      <h1>{life.name}</h1>
      <p>享年 {life.death.ageAtDeath} 岁</p>
      <dl>
        <div>
          <dt>死因</dt>
          <dd>{deathCauseLabels[life.death.causeOfDeath] ?? life.death.causeOfDeath}</dd>
        </div>
        <div>
          <dt>净资产</dt>
          <dd>${life.death.netWorth.toLocaleString("zh-CN")}</dd>
        </div>
        <div>
          <dt>得分</dt>
          <dd>{life.death.score}</dd>
        </div>
      </dl>
      <div className="tag-row">
        {life.death.tags.map((tag) => (
          <span key={tag}>{formatTombstoneTag(tag)}</span>
        ))}
      </div>
      {shareId ? <p>分享编号：{shareId}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <div className="button-row">
        <button type="button" disabled={isSubmitting || Boolean(shareId)} onClick={handleSubmit}>
          {isSubmitting ? "提交中..." : "匿名提交"}
        </button>
        <button className="primary-button" type="button" onClick={onStart}>
          开始新人生
        </button>
      </div>
    </section>
  );
}
