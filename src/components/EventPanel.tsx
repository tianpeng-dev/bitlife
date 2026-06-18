import { catalog } from "../content/catalog";

export function EventPanel({
  eventId,
  onChoose
}: {
  eventId: string;
  onChoose(choiceId: string): void;
}) {
  const event = catalog.events.find((item) => item.id === eventId);
  if (!event) return null;
  const zh = catalog.locales["zh-CN"];

  return (
    <section className="panel event-panel">
      <p>{zh[event.promptKey]}</p>
      <div className="choice-grid">
        {event.choices.map((choice) => (
          <button key={choice.id} type="button" onClick={() => onChoose(choice.id)}>
            {zh[choice.labelKey]}
          </button>
        ))}
      </div>
    </section>
  );
}
