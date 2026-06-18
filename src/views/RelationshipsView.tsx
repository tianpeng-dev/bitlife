import type { LifeState, RelationshipType } from "../domain/types";

const relationLabels: Record<RelationshipType, string> = {
  parent: "父母",
  sibling: "手足",
  friend: "朋友",
  lover: "恋人",
  spouse: "伴侣",
  child: "孩子"
};

export function RelationshipsView({ life }: { life?: LifeState }) {
  if (!life) {
    return (
      <section className="panel empty-state">
        <h1>关系</h1>
        <p>开始新人生后，你的家人和朋友会出现在这里。</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="view-heading">
        <h1>关系</h1>
        <p>亲密度会随事件和活动上下波动。</p>
      </div>
      {life.relationships.length === 0 ? (
        <section className="panel empty-state">
          <p>这一生还没有可记录的关系。</p>
        </section>
      ) : (
        <div className="relationship-list">
          {life.relationships.map((person) => (
            <article className="panel relationship-card" key={person.id}>
              <div>
                <span>{relationLabels[person.relationType]}</span>
                <h2>{person.name}</h2>
                <p>{person.age}岁 · {person.alive ? "健在" : "已故"}</p>
              </div>
              <strong>{person.relationship}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
