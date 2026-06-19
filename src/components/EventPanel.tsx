import { catalog } from "../content/catalog";
import type { Locale } from "../domain/types";
import { contentLabel, ui } from "../i18n";

const domainLabelKeys: Record<string, Parameters<typeof ui>[1]> = {
  family: "eventFamily",
  school: "eventSchool",
  career: "eventCareer",
  health: "eventHealth",
  relationship: "eventRelationship",
  misc: "eventMisc"
};

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
    <div className="modal-backdrop event-backdrop">
      <section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
        <div className="event-modal__tab" aria-hidden="true">
          {ui(locale, "eventMisc")}
        </div>
        <div className="event-modal__body">
          <h2 id="event-modal-title">{ui(locale, domainLabelKeys[event.domain] ?? "eventMisc")}</h2>
          <p>{contentLabel(locale, event.promptKey)}</p>
          <strong>{ui(locale, "eventQuestion")}</strong>
        </div>
        <div className="choice-grid">
          {event.choices.map((choice) => (
            <button key={choice.id} type="button" onClick={() => onChoose(choice.id)}>
              {contentLabel(locale, choice.labelKey)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
