# Project Health

## Aktueller Projektstatus

- Projektbasis ist stabil: Next.js App Router, klare Trennung zwischen Website und Admin.
- Öffentliche Website ist weitgehend abgeschlossen.
- Adminbereich ist weitgehend funktionsfähig.
- Settings/CMS sind aktiv in Nutzung (Footer, Kontakt, Rechtstexte, Mitgliedschaftsprozesse).

## Architektur-Bewertung

- Positiv:
  - Gute Trennung zwischen App-Routen (`src/app`), UI-Komponenten (`src/components`) und Basis-Helfern (`src/lib`).
  - Feature-nahe Services im jeweiligen Modul sind konsistent organisiert.
- Auffällig:
  - Einzelne Utility-Logik ist noch parallel vorhanden (z. B. Slug-Helfer in mehreren Modulen).
  - Der Events-/Trainingsbereich ist funktional stark gewachsen und enthält große Dateien.
  - Der Settings-Editor ist funktional umfassend und als interner Refactor-Kandidat markiert.

## Funktionsstand (fachlich)

- umgesetzt:
  - dynamischer Footer
  - Kontaktseite, Impressum, Datenschutz
  - Pages-CMS (`pages`), `club_settings`, `club_contacts`
  - Mitglied-werden-Formular, Mitgliedsanfragen, Weiterleitung
  - Vereinsgeschichte mit RichText
  - News
  - Termine, wiederkehrende Termine, virtuelle Trainings
  - Mannschaftsseiten und Fußball-Übersichtsseiten
  - Vorstand, Trainer, Sponsoren
  - Admin-Einstellungen

## Technische Schulden (priorisiert)

- hoch:
  - interne Entkopplung sehr großer Dateien ohne Funktionsänderung
- mittel:
  - Utility-Duplikate konsolidieren
  - Lint-/Qualitätsbaustellen schrittweise abbauen
- niedrig:
  - finale Dokumentationspflege im Tagesgeschäft

## Empfehlungen für Phase 2

1. Mailversand für Mitgliedsanfragen finalisieren.
2. Mitgliedsanfragen-Historie ergänzen.
3. Dashboard-Erinnerungen einführen.
4. Cookie-Einstellungen ergänzen.
5. Rollen/Rechte ausbauen.
6. Performance/Deployment/Backups operationalisieren.

## Fazit

Das Projekt ist fachlich in einem stabilen Zustand mit hoher Abdeckung der Vereinsanforderungen. Der Fokus verschiebt sich von Grundfunktionalität auf Betriebsreife, Governance und gezielte interne Refactors.
