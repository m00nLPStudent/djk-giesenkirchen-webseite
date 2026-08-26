# Project Health

Stand: 26. August 2026

## Aktueller Stand

- Next.js App Router mit getrennter öffentlicher Website und Adminbereich.
- Adminbereich modularisiert; Settings/CMS, Membership, News, Events, Teams, Personen, Sponsoren und Chronik aktiv integriert.
- B15.18 Notification-/Reminder-System einschließlich Audit-, Idempotenz- und Append-Härtung abgeschlossen; operative Cron-Aktivierung bleibt Go-live.
- B15.19 zentrale Medienbibliothek und Fachintegrationen einschließlich Rollen-/Security-Nachläufen abgeschlossen.
- öffentliche Kernbereiche sind vorhanden; visuelle, responsive und vollständige Go-live-Abnahme bleibt geplant.

## Architekturregeln

- privilegierte Mutationen prüfen zuerst Session und bestehende Permission; Service Role ersetzt keine Autorisierung.
- direkte Browser-Schreibpfade auf gehärtete Fach- und Medientabellen dürfen nicht wieder eingeführt werden.
- Proposal-, Postcheck- und Rollback-SQL bleiben gemeinsam dokumentiert und werden nie automatisch ausgeführt.

## Bekannte Qualitätspunkte

Der zuletzt dokumentierte Gesamtlauf vor B15.20 hatte 766 Tests mit drei unabhängigen Fehlern: zwei News-UI-Strukturtests und `teamCoachAssignments.core.test.mjs`. ESLint-, Dependency- und Dateigrößenbestand sind im technischen Cleanup neu zu messen; alte Zahlen gelten nicht als aktuell.

## Planung

Die verbindliche offene Reihenfolge steht in der [aktuellen Roadmap](../planning/current-roadmap.md). Nächster Fachblock ist die Überarbeitung des Mitglied-werden-Formulars; Go-live bleibt davon getrennt.
