# Project Health

Stand: 28. August 2026

## Aktueller Stand

- Next.js App Router mit getrennter öffentlicher Website und Adminbereich.
- Adminbereich modularisiert; Settings/CMS, Membership, News, Events, Teams, Personen, Sponsoren und Chronik aktiv integriert.
- B15.18 Notification-/Reminder-System einschließlich Audit-, Idempotenz- und Append-Härtung abgeschlossen; operative Cron-Aktivierung bleibt Go-live.
- B15.19 zentrale Medienbibliothek und Fachintegrationen einschließlich Rollen-/Security-Nachläufen abgeschlossen.
- öffentliche Kernbereiche sind vorhanden. B15.24A hat den Bestand inventarisiert; B15.24B strukturiert Gesamtverein und vier Abteilungen, beseitigt tote Navigationsziele und steht auf `IMPLEMENTED / PARTIAL MANUAL REVIEW COMPLETE / REMAINING WEBSITE REVIEW PENDING`. Der restliche visuelle Browser-/Designreview wird im nächsten Arbeitsschritt fortgesetzt; die vollständige Go-live-Abnahme bleibt geplant.

## Architekturregeln

- privilegierte Mutationen prüfen zuerst Session und bestehende Permission; Service Role ersetzt keine Autorisierung.
- direkte Browser-Schreibpfade auf gehärtete Fach- und Medientabellen dürfen nicht wieder eingeführt werden.
- Proposal-, Postcheck- und Rollback-SQL bleiben gemeinsam dokumentiert und werden nie automatisch ausgeführt.

## Bekannte Qualitätspunkte

Die drei früher dokumentierten Testfehler wurden in einem kleinen Wartungsblock korrigiert. Der B15.24B-Lauf nach Browser-Nacharbeit 10 ist mit 1063/1063 Tests grün; Produktionsbuild und TypeScript bestehen. Die Repository-ESLint-Baseline bleibt unverändert bei 8 Fehlern und 35 Warnungen; der geänderte Nacharbeit-10-Scope enthält keinen Fehler. Dependency- und Dateigrößenbestand bleiben im technischen Cleanup gesondert zu bewerten.

## Planung

Die verbindliche offene Reihenfolge steht in der [aktuellen Roadmap](../planning/current-roadmap.md). B15.24B ist implementiert und befindet sich im manuellen Review; B15.24C folgt erst nach dessen Freigabe und mit geklärtem Referenzdesign. Go-live bleibt davon getrennt.
