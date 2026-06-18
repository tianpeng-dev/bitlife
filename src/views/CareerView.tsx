import { catalog } from "../content/catalog";
import type { LifeState } from "../domain/types";

const educationLabels: Record<LifeState["education"]["stage"], string> = {
  none: "未入学",
  primary: "小学",
  secondary: "中学",
  university: "大学",
  graduated: "已毕业"
};

export function CareerView({ life }: { life?: LifeState }) {
  if (!life) {
    return (
      <section className="panel empty-state">
        <h1>职业</h1>
        <p>开始新人生后，教育和职业履历会在这里更新。</p>
      </section>
    );
  }

  const career = catalog.careers.find((item) => item.id === life.career.careerId);
  const careerTitle = life.career.title ?? (career ? catalog.locales["zh-CN"][career.titleKey] : "暂无职业");

  return (
    <section className="stack">
      <div className="view-heading">
        <h1>职业</h1>
        <p>学习、兼职和工作活动会逐步改变职业状态。</p>
      </div>
      <section className="panel career-grid">
        <article>
          <span>教育</span>
          <h2>{educationLabels[life.education.stage]}</h2>
          <p>已完成 {life.education.yearsCompleted} 年</p>
        </article>
        <article>
          <span>工作</span>
          <h2>{careerTitle}</h2>
          <p>年薪 ${life.career.salary.toLocaleString("zh-CN")}</p>
        </article>
        <article>
          <span>表现</span>
          <h2>{life.career.performance}</h2>
          <p>工作 {life.career.years} 年</p>
        </article>
      </section>
    </section>
  );
}
