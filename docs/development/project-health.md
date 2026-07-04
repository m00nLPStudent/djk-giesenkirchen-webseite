# Project Health

## Aktueller Projektstatus

- Projektbasis ist stabil: Next.js App Router, klar getrennte Bereiche für Website und Admin.
- News-Modul inklusive Dokumentanhängen ist funktional umgesetzt.
- Gemeinsame Helfer wurden zuletzt erweitert:
  - src/lib/files.js (Datei-Helfer)
  - src/lib/storage.js (Storage-Helfer)
- Dokumentation wurde in Strukturordner gegliedert (architecture, modules, decisions, development).

## Architektur-Bewertung

- Positiv:
  - Gute Trennung zwischen App-Routen (src/app), UI-Komponenten (src/components) und Basis-Helfern (src/lib).
  - Feature-nahe Services im jeweiligen Modul sind konsistent organisiert.
- Auffällig:
  - Einzelne Utility-Logik ist noch parallel vorhanden (z. B. getFileExtension in src/lib/storage.js und src/lib/files.js).
  - Ein serverseitiger Scraper-Helfer scheint aktuell ohne Referenz im Code zu sein: src/lib/fussball-de/fussballDe.server.js.

## Modularisierung

- Fortschritt:
  - Datei-Helfer (Dateiendung, Dateigröße, Anzeigename, erlaubte Dokumenttypen) sind zentral in src/lib/files.js gebündelt.
  - Wiederkehrende Storage-Operationen (upload/getPublicUrl/remove) sind in src/lib/storage.js zentralisiert.
- Restbedarf:
  - Doppelte Slug-Helfer in drei Modulen können in einen gemeinsamen Helper überführt werden:
    - src/components/admin/news/utils/slug.js
    - src/components/admin/coaches/utils/slug.js
    - src/components/admin/teams/utils/slug.js

## Wiederverwendbarkeit

- Positiv:
  - Viele Admin-Services nutzen bereits gemeinsame Storage-Helfer.
  - Gemeinsame Form- und UI-Bausteine sind vorhanden.
- Verbesserungsoption:
  - Ein einheitlicher, gemeinsamer Slug-Helper für Admin-Module.
  - Optional: getFileExtension nur noch aus einer Quelle verwenden.

## Prüfungsergebnisse (Code Health)

Projektweiter Lint-Lauf (cmd /c npm run lint):

- 28 Probleme insgesamt
- 5 Errors
- 23 Warnings

Hauptbefunde:

- Errors (hoch):
  - Mehrere Stellen mit react-hooks/set-state-in-effect
  - Betroffene Dateien:
    - src/components/admin/news/forms/NewsEditorForm.js
    - src/components/admin/players/AdminPlayersList.js
    - src/components/admin/topbar/AdminTopbarClock.js
    - src/components/admin/ui/AdminClock.js
    - src/components/website/football-de/FootballDeWidget.js
- Warnings (mittel):
  - Häufige Nutzung von img statt Next Image (Performance-Hinweis)
- Doppelte Helper (mittel):
  - createSlug in drei Admin-Modulen doppelt
  - getFileExtension in src/lib/files.js und src/lib/storage.js doppelt
- Potenziell tote Datei (niedrig bis mittel, fachlich prüfen):
  - src/lib/fussball-de/fussballDe.server.js (keine Referenz gefunden)

## Offene technische Schulden

- React-Hook-Fehler im Lint (setState in useEffect) beheben.
- Doppelte Slug-Helfer konsolidieren.
- getFileExtension auf eine gemeinsame Quelle reduzieren.
- Unreferenzierten fussball.de-Serverhelper fachlich verifizieren und ggf. entfernen oder anbinden.
- Bildoptimierung (Next Image) schrittweise in kritischen Seiten priorisieren.

## Empfehlungen für die nächsten Entwicklungsschritte

1. Lint-Errors zuerst beheben (ohne Featureänderung).
2. Slug-Helfer zentralisieren (kleiner, risikoarmer Refactor).
3. Doppelte getFileExtension-Funktion bereinigen.
4. Unreferenzierte Dateien mit Team fachlich validieren und aufräumen.
5. Danach Performance-Hinweise zu img schrittweise angehen.

## Prioritäten

- Hoch:
  - react-hooks/set-state-in-effect Fehler (5 Vorkommen)
- Mittel:
  - Doppelte Slug-Utilities
  - Doppelte getFileExtension-Logik
  - no-img-element Warnungen in häufigen Seiten
- Niedrig:
  - Dokumentierte Legacy-Dokumente weiter konsolidieren
  - Potenziell tote Datei nur nach fachlicher Bestätigung bereinigen

## Was wurde durch dieses Refactoring verbessert?

- Dateibezogene Regeln sind nun zentral dokumentiert und im Code wiederverwendbar.
- Storage-Operationen sind modularisiert, wodurch Services konsistenter und wartbarer sind.
- Der Docs-Bereich ist strukturiert und für neue Entwickler schneller navigierbar.
- Die wichtigsten verbleibenden Risiken sind klar priorisiert und umsetzbar beschrieben.
