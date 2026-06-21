import { catalog } from "../content/catalog";
import type { LifeState, Locale } from "../domain/types";
import { contentLabel, formatNumber, ui } from "../i18n";

const educationLabelKeys: Record<LifeState["education"]["stage"], Parameters<typeof ui>[1]> = {
  none: "eduNone",
  primary: "eduPrimary",
  secondary: "eduSecondary",
  university: "eduUniversity",
  graduated: "eduGraduated"
};

export function CareerView({ life, locale }: { life?: LifeState; locale: Locale }) {
  if (!life) {
    return (
      <section className="panel empty-state">
        <h1>{ui(locale, "careerTitle")}</h1>
        <p>{ui(locale, "careerEmpty")}</p>
      </section>
    );
  }

  const career = catalog.careers.find((item) => item.id === life.career.careerId);
  const careerTitle = life.career.title ?? (career ? contentLabel(locale, career.titleKey) : ui(locale, "noCareer"));
  const titleKey = life.career.careerId || life.career.salary || life.career.years ? "careerTitle" : "navSchool";
  const fameScore = life.fame?.score ?? 0;
  const publicSentiment = life.fame?.publicSentiment ?? 0;
  const socialAccountCount = life.socialAccounts?.length ?? 0;

  return (
    <section className="stack">
      <div className="view-heading">
        <h1>{ui(locale, titleKey)}</h1>
        <p>{ui(locale, "careerHint")}</p>
      </div>
      <section className="panel career-grid">
        <article>
          <span>{ui(locale, "education")}</span>
          <h2>{ui(locale, educationLabelKeys[life.education.stage])}</h2>
          <p>{ui(locale, "completedYears", { years: life.education.yearsCompleted })}</p>
        </article>
        <article>
          <span>{ui(locale, "work")}</span>
          <h2>{careerTitle}</h2>
          <p>{ui(locale, "annualSalary", { amount: formatNumber(locale, life.career.salary) })}</p>
        </article>
        <article>
          <span>{ui(locale, "performance")}</span>
          <h2>{life.career.performance}</h2>
          <p>{ui(locale, "workYears", { years: life.career.years })}</p>
        </article>
      </section>
      {fameScore > 0 || socialAccountCount > 0 ? (
        <section className="panel career-grid">
          <article>
            <span>{ui(locale, "fameScoreLabel")}</span>
            <h2>{fameScore}</h2>
            <p>{ui(locale, "publicSentimentLabel")}: {publicSentiment}</p>
          </article>
          <article>
            <span>{ui(locale, "socialAccountCountLabel")}</span>
            <h2>{socialAccountCount}</h2>
            <p>{ui(locale, "groupSocial")}</p>
          </article>
        </section>
      ) : null}
    </section>
  );
}
