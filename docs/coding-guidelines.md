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
├── services/
├── utils/
└── index.js
```

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
