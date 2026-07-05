# Components

## Schichten

- `src/components/website` – öffentliche Seitenbausteine (Navigation, Footer, Module)
- `src/components/admin` – Adminlisten, Formulare, Services, modulare UI-Bausteine
- `src/components/common` – geteilte Komponenten

## Wichtige Website-Komponenten

- Header/Navigationssystem inklusive CTA-Link "Mitglied werden"
- dynamischer Footer auf Basis von `club_settings` und `pages`
- Modulkomponenten für News, Fußball, Termine, Mitgliedschaft

## Wichtige Admin-Komponenten

- gemeinsame Formularfelder (`components/admin/forms`)
- gemeinsame Hooks (`components/admin/hooks`)
- gemeinsame UI-Bausteine (`components/admin/ui`)
- Lösch-/Delete-Flow (`components/admin/delete`)
- modulare Fachkomponenten pro Bereich (`news`, `teams`, `events`, `settings`, `club-history`, ...)

## Wiederverwendungsprinzip

- Erst vorhandene Bausteine prüfen, dann neue Komponente einführen.
- Fachlogik in modulnahe Services/Helper auslagern.
- Komplexe Editor-/Form-Komponenten schrittweise intern modularisieren, ohne externes Verhalten zu ändern.
