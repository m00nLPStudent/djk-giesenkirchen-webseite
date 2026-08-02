# B15.16H4 – Terminarten zentralisieren

## Zielbild

`event_types` ist die einzige Quelle für auswählbare Terminarten und deren deutsche Labels. `events.event_type` bleibt unverändert der gespeicherte Schlüssel. Bestehende Termin-, Wiederholungs- und Trainingslogik sowie Datenbank-Constraints bleiben unangetastet.

## Architektur

- `loadEventTypes(db, { activeOnly })` lädt die Stammdaten einmal je Ladegrenze, standardmäßig nur aktive Einträge und immer nach `sort_order`.
- Mapper erzeugen `eventTypeKey` und `eventTypeLabel`; unbekannte oder entfernte Schlüssel erhalten den Fallback „Unbekannte Terminart“.
- Formulare erhalten aktive Terminarten als Daten und speichern weiterhin ausschließlich `event_type`.
- Öffentliche Karten und Detailansichten konsumieren ausschließlich das bereits aufgelöste Label.
- Listen werden nach einem gemeinsamen Kategorien-Load per Map aufgelöst; es entstehen keine N+1-Abfragen.
- Änderungen an Terminarten revalidieren die bereits registrierten öffentlichen Terminseiten.

## Bewusst unverändert

Virtuelle Trainings behalten den Systemschlüssel `training`. Trainings-Untertypen, Wiederholungen, Events, Slugs, URLs, Permissions, RLS, SQL, öffentliche Routen und bestehende Datensätze wurden nicht verändert.
