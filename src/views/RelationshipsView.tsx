import type { LifeState, Locale, RelationshipType } from "../domain/types";
import { ui } from "../i18n";

const relationLabelKeys: Record<RelationshipType, Parameters<typeof ui>[1]> = {
  parent: "relationParent",
  sibling: "relationSibling",
  friend: "relationFriend",
  lover: "relationLover",
  spouse: "relationSpouse",
  child: "relationChild"
};

export function RelationshipsView({ life, locale }: { life?: LifeState; locale: Locale }) {
  if (!life) {
    return (
      <section className="panel empty-state">
        <h1>{ui(locale, "relationshipsTitle")}</h1>
        <p>{ui(locale, "relationshipsEmpty")}</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="view-heading">
        <h1>{ui(locale, "relationshipsTitle")}</h1>
        <p>{ui(locale, "relationshipsHint")}</p>
      </div>
      {life.relationships.length === 0 ? (
        <section className="panel empty-state">
          <p>{ui(locale, "noRelationships")}</p>
        </section>
      ) : (
        <div className="relationship-list">
          {life.relationships.map((person) => (
            <article className="panel relationship-card" key={person.id}>
              <div>
                <span>{ui(locale, relationLabelKeys[person.relationType])}</span>
                <h2>{person.name}</h2>
                <p>
                  {ui(locale, "ageStatus", { age: person.age })} · {person.alive ? ui(locale, "alive") : ui(locale, "dead")}
                </p>
              </div>
              <strong>{person.relationship}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
