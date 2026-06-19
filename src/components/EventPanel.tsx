import { catalog } from "../content/catalog";
import type { Locale } from "../domain/types";
import { contentLabel } from "../i18n";

export function EventPanel({
  eventId,
  locale,
  onChoose
}: {
  eventId: string;
  locale: Locale;
  onChoose(choiceId: string): void;
}) {
  const event = catalog.events.find((item) => item.id === eventId);
  if (!event) return null;

  return (
    <section className="panel event-panel">
      <p>{contentLabel(locale, event.promptKey)}</p>
      <div className="choice-grid">
        {event.choices.map((choice) => (
          <button key={choice.id} type="button" onClick={() => onChoose(choice.id)}>
            {contentLabel(locale, choice.labelKey)}
          </button>
        ))}
      </div>
    </section>
  );
}
