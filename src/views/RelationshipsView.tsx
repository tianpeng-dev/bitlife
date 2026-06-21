import { catalog } from "../content/catalog";
import type { LifeState, Locale, PetState, RelationshipType } from "../domain/types";
import { contentLabel, ui } from "../i18n";

const relationLabelKeys: Record<RelationshipType, Parameters<typeof ui>[1]> = {
  parent: "relationParent",
  sibling: "relationSibling",
  friend: "relationFriend",
  lover: "relationLover",
  spouse: "relationSpouse",
  child: "relationChild"
};

function petDisplayName(pet: PetState, locale: Locale): string {
  return pet.name.startsWith("p1.") ? contentLabel(locale, pet.name) : pet.name;
}

function petSpeciesLabel(pet: PetState, locale: Locale): string {
  const config = catalog.p1.pets.find((candidate) => candidate.id === pet.catalogId);
  return config ? contentLabel(locale, config.nameKey) : pet.catalogId;
}

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
      {life.relationships.length === 0 && (life.pets ?? []).length === 0 ? (
        <section className="panel empty-state">
          <p>{ui(locale, "noRelationships")}</p>
        </section>
      ) : (
        <>
          {life.relationships.length > 0 ? (
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
          ) : null}
          {(life.pets ?? []).length > 0 ? (
            <section className="stack">
              <div className="panel-heading">
                <h2>{ui(locale, "petCountLabel")}</h2>
                <span>{life.pets?.length ?? 0}</span>
              </div>
              <div className="relationship-list">
                {(life.pets ?? []).map((pet) => (
                  <article className="panel relationship-card" key={pet.id}>
                    <div>
                      <span>{petSpeciesLabel(pet, locale)}</span>
                      <h2>{petDisplayName(pet, locale)}</h2>
                      <p>
                        {ui(locale, "ageStatus", { age: pet.age })} · {pet.alive ? ui(locale, "alive") : ui(locale, "dead")}
                      </p>
                    </div>
                    <strong>{pet.relationship}</strong>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}
