# Project Health

Stand: 28. August 2026

## Aktueller Stand

- Next.js App Router mit getrennter öffentlicher Website und Adminbereich.
- Adminbereich modularisiert; Settings/CMS, Membership, News, Events, Teams, Personen, Sponsoren und Chronik aktiv integriert.
- B15.18 Notification-/Reminder-System einschließlich Audit-, Idempotenz- und Append-Härtung abgeschlossen; operative Cron-Aktivierung bleibt Go-live.
- B15.19 zentrale Medienbibliothek und Fachintegrationen einschließlich Rollen-/Security-Nachläufen abgeschlossen.
- Öffentliche Kernbereiche sind vorhanden. B15.24A hat den Bestand inventarisiert; B15.24B ist nach vollständigem Desktop-/Smartphone-Review abgeschlossen. B15.24C hat den bestätigten As-built-Designvertrag ohne Redesign oder neuen Referenzinput konsolidiert. Die fachliche Inhaltsbefüllung, Accessibility/Performance/SEO und vollständige Go-live-Abnahme bleiben eigene Folgeblöcke.

## Architekturregeln

- privilegierte Mutationen prüfen zuerst Session und bestehende Permission; Service Role ersetzt keine Autorisierung.
- direkte Browser-Schreibpfade auf gehärtete Fach- und Medientabellen dürfen nicht wieder eingeführt werden.
- Proposal-, Postcheck- und Rollback-SQL bleiben gemeinsam dokumentiert und werden nie automatisch ausgeführt.

## Bekannte Qualitätspunkte

Die drei früher dokumentierten Testfehler wurden in einem kleinen Wartungsblock korrigiert. Der finale B15.24B-Abschlusslauf war mit 1090/1090 Tests grün; Produktionsbuild und TypeScript bestanden. Im geänderten Scope bestanden keine ESLint-Fehler; bekannte `no-img-element`-Warnungen bleiben für den späteren Performanceblock sichtbar. Dependency-, Bildoptimierungs- und Dateigrößenbestand werden im technischen Cleanup beziehungsweise B15.24L gesondert bewertet.

## Planung

Die verbindliche offene Reihenfolge steht in der [aktuellen Roadmap](../planning/current-roadmap.md). B15.24B und B15.24C sind abgeschlossen. B15.24D wird als Nächstes gegen den tatsächlich bereits umgesetzten Header-/Layoutstand neu bewertet. Go-live bleibt davon getrennt.
