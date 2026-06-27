# Coding Guidelines

Dieses Dokument legt die technischen Regeln für die Entwicklung der Vereinsplattform fest.

## Allgemein

- Das Projekt wird modular aufgebaut.
- Jede größere Funktion bekommt ein eigenes Modul.
- Code soll klar, lesbar und wiederverwendbar sein.
- Keine unnötigen Abhängigkeiten einbauen.
- Keine Datenbankfelder verwenden, die nicht geprüft wurden.

## Modulaufbau

Ein Admin-Modul soll nach Möglichkeit so aufgebaut sein:

```txt
components/admin/<modul>/
├── components/
├── forms/
├── list/
├── services/
├── stats/
└── index.js
```

Nicht jedes Modul braucht jeden Ordner. Ordner werden nur angelegt, wenn sie fachlich sinnvoll sind.

## App-Routen

Adminseiten liegen unter:

```txt
src/app/admin/<modul>/
├── page.js
├── new/page.js
└── edit/[id]/page.js
```

Öffentliche Webseiten liegen unter:

```txt
src/app/(website)/
```

## Services

- Datenbankzugriffe aus Client-Komponenten laufen über Service-Dateien.
- Ein Service ist für eine Tabelle oder ein Modul zuständig.
- Services bereiten Daten vor, bevor sie an Supabase gesendet werden.
- Upload- und Storage-Logik soll möglichst über gemeinsame Helfer in `src/lib/storage.js` laufen.

Beispiel:

```txt
components/admin/players/services/players.service.js
```

## Komponenten

- Komponenten sollen klein und eindeutig benannt sein.
- Listen heißen `Admin...List`.
- Formulare heißen `Admin...Form`.
- Karten heißen `...Card`.
- Filter heißen `...Filters`.
- Statusanzeigen heißen `...StatusBadge`.
- Wiederverwendbare Admin-Formularfelder liegen unter `src/components/admin/forms/`.
- Fachliche Hilfslogik gehört in `*.helpers.js`.
- Fachliche Optionen und Pflichtfelder gehören in `*.config.js`.

## Formulare

Formulare werden in Feldgruppen zerlegt, sobald sie zu groß werden.

Beispiel:

```txt
forms/
├── AdminPlayersForm.js
├── playerForm.config.js
├── playerForm.helpers.js
└── fields/
    ├── PlayerBasicFields.js
    ├── PlayerSportFields.js
    └── PlayerProfileFields.js
```

## Öffentliche Detailseiten

Öffentliche Detailseiten werden ebenfalls in Komponenten zerlegt, sobald sie mehr als reine Datenabfrage und Layout enthalten.

Beispiel:

```txt
components/website/player-profile/
├── PlayerProfileImageCard.js
├── PlayerProfileHeader.js
├── PlayerProfileStatsGrid.js
├── PlayerProfileDescription.js
├── playerProfile.helpers.js
└── index.js
```

## Styling

- TailwindCSS wird direkt in den Komponenten verwendet.
- Dunkles Design bleibt Standard.
- Vereinsfarbe Rot wird für aktive Zustände, Hover und Hauptaktionen genutzt.

## Datenbank und UI

Vor jeder UI-Anpassung muss klar sein:

- Welche Tabelle wird verwendet?
- Welche Spalten existieren wirklich?
- Welche Felder dürfen gespeichert werden?
- Welche Felder werden nur angezeigt?

## Git-Regeln

- Kleine, nachvollziehbare Commits.
- Keine halbfertigen Funktionsänderungen committen, wenn sie bekannte Buildfehler erzeugen.
- Nach größeren Änderungen lokal testen mit:

```bash
npm run dev
npm run build
```
