# Projektstatus

Stand: 26. August 2026

## Gesamtstatus

- B15.18 ist technisch abgeschlossen. Die Produktivaktivierung des Contribution-Reminder-Crons bleibt ein Go-live-Thema.
- B15.19 einschließlich H, I, J, J1, J2, J2.1 und J2.2 ist im Repository abgeschlossen.
- B15.20 konsolidiert Dokumentation und Planung; es führt keine fachliche oder datenbankseitige Änderung aus.
- Verbindliche aktuelle Planung: [Aktuelle Roadmap](current-roadmap.md).
- Kompakter Abschlussnachweis: [Abgeschlossene Entwicklungsblöcke](completed-development-blocks.md).
- SQL-Status und Aufbewahrungsregeln: [SQL-Register](../sql/README.md).

## Nächster Fachblock

Überarbeitung des öffentlichen Formulars „Mitglied werden“. Eine bestehende verbindliche Nummer wurde nicht gefunden; `B15.21` ist deshalb nur der vorgeschlagene nächste Bezeichner und vor Beginn zu bestätigen.

## Bekannte technische Altfehler

Der letzte vollständige Testlauf vor B15.20 enthielt 766 Tests: 763 bestanden, drei unabhängige Fehler blieben in zwei News-UI-Strukturtests und `teamCoachAssignments.core.test.mjs`. Zahlen sind bei Aufnahme des technischen Cleanup-Blocks neu zu ermitteln.
