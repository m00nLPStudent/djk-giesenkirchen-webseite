# Project Health

Stand: 28. August 2026

## Aktueller Stand

- Next.js App Router mit getrennter öffentlicher Website und Adminbereich.
- Adminbereich modularisiert; Settings/CMS, Membership, News, Events, Teams, Personen, Sponsoren und Chronik aktiv integriert.
- B15.18 Notification-/Reminder-System einschließlich Audit-, Idempotenz- und Append-Härtung abgeschlossen; operative Cron-Aktivierung bleibt Go-live.
- B15.19 zentrale Medienbibliothek und Fachintegrationen einschließlich Rollen-/Security-Nachläufen abgeschlossen.
- öffentliche Kernbereiche sind vorhanden. B15.24A hat den tatsächlichen Bestand als 30 Seiten und zwei öffentliche Handler inventarisiert; visuelle, responsive und vollständige Go-live-Abnahme bleibt geplant.

## Architekturregeln

- privilegierte Mutationen prüfen zuerst Session und bestehende Permission; Service Role ersetzt keine Autorisierung.
- direkte Browser-Schreibpfade auf gehärtete Fach- und Medientabellen dürfen nicht wieder eingeführt werden.
- Proposal-, Postcheck- und Rollback-SQL bleiben gemeinsam dokumentiert und werden nie automatisch ausgeführt.

## Bekannte Qualitätspunkte

Die drei früher dokumentierten Testfehler wurden in einem kleinen Wartungsblock korrigiert. Der B15.23E-Abschlusslauf war mit 1046/1046 Tests grün. Die Repository-ESLint-Baseline bleibt bei 8 Fehlern und 35 Warnungen; der fokussierte öffentliche Scope aus B15.24A enthält davon einen Fehler im Football.de-Widget sowie 16 `no-img-element`-Warnungen. Dependency- und Dateigrößenbestand bleiben im technischen Cleanup gesondert zu bewerten.

## Planung

Die verbindliche offene Reihenfolge steht in der [aktuellen Roadmap](../planning/current-roadmap.md). B15.24A ist der aktuelle abgeschlossene Analyseblock; nächster Fachblock ist B15.24B – Gesamtvereins-Informationsarchitektur und Navigation. Go-live bleibt davon getrennt.
