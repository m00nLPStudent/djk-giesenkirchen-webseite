# Routes

## Finale öffentliche Struktur

- `/`
- `/verein`
  - Fußball (`/fussball`)
  - Tischtennis (`/tischtennis`)
  - Damen-Gymnastik (`/damen-gymnastik`)
- `/fussball`
  - Mannschaften (`/fussball/mannschaften`)
    - Junioren (`/fussball/mannschaften/junioren`)
    - Senioren (`/fussball/mannschaften/senioren`)
    - Damen (`/fussball/mannschaften/damen`)
  - Abteilung (`/fussball/abteilung`)
    - Vorstand (`/fussball/abteilung/vorstand`)
    - Trainer (`/fussball/abteilung/trainer`)
    - Sponsoren (inhaltlich im Fußballbereich unter `/fussball/sponsoren`)
  - Turniere & Events (`/fussball/turniere-events`)
  - Vereinsgeschichte (`/fussball/vereinsgeschichte`)
- `/news`
  - Übersicht (`/news/uebersicht`)
  - Detail (`/news/[slug]`)
- `/termine`
  - Training (`/termine/training`)
  - Allgemein (`/termine/allgemein`)
  - Detail (`/termine/[slug]`)
  - Training-Detail (`/termine/training/[occurrenceId]`)
  - ICS (`/termine/[slug]/ics`)
- `/mitglied-werden`
- `/kontakt`
- `/impressum`
- `/datenschutz`

## Weitere öffentliche Routen

- `/trainer/[slug]`
- `/fussball/[slug]`
- `/fussball/[slug]/spieler/[playerId]`

## Admin-Routen (Bestand)

Admin-Routen bleiben unverändert unter `/admin/*` und sind in der öffentlichen Release-Abschlussdokumentation nicht fachlich erweitert worden.
