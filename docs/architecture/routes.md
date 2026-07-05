# Routes

## Website-Routen

- `/` – Startseite
- `/news` – aktuelle News
- `/news/uebersicht` – News-Übersicht mit Suche/Pagination
- `/news/[slug]` – News-Detailseite
- `/termine` – Termine-Landingpage
- `/termine/training` – virtuelle Trainings
- `/termine/allgemein` – allgemeine Vereinstermine
- `/termine/[slug]` – Event-Detailseite
- `/termine/training/[occurrenceId]` – virtuelles Trainings-Detail
- `/termine/[slug]/ics` – ICS-Export für echte Events
- `/mitglied-werden` – Mitgliedschaftsformular
- `/kontakt` – Kontaktseite
- `/impressum` – Impressum
- `/datenschutz` – Datenschutz
- `/fussball` – Fußball-Übersichtsseite
- `/fussball/mannschaften` – Mannschaftsübersicht
- `/fussball/mannschaften/junioren` – Junioren-Teams
- `/fussball/mannschaften/senioren` – Senioren-Teams
- `/fussball/mannschaften/damen` – Damen-Teams
- `/fussball/[slug]` – Mannschaftsdetail
- `/fussball/abteilung` – Abteilungsübersicht
- `/fussball/abteilung/vorstand` – Vorstand
- `/fussball/abteilung/trainer` – Trainer und Betreuer
- `/fussball/sponsoren` – Sponsorenübersicht
- `/fussball/vereinsgeschichte` – Vereinsgeschichte
- `/trainer` – Trainer-Übersicht
- `/tischtennis` – Bereich Tischtennis
- `/damen-gymnastik` – Bereich Damen-Gymnastik

## Admin-Routen

- `/admin` – Dashboard
- `/admin/news` – News-Verwaltung
- `/admin/teams` – Mannschaften
- `/admin/players` – Spieler
- `/admin/coaches` – Trainer/Betreuer
- `/admin/events` – Termine/Events
- `/admin/department` – Abteilung/Vorstand
- `/admin/sponsors` – Sponsoren
- `/admin/club-history` – Vereinsgeschichte
- `/admin/settings` – zentrale Einstellungen, Seiten-CMS, Mitgliedsanfragen
- `/admin/media`, `/admin/matches`, `/admin/tournaments`, `/admin/users` – vorhandene Adminbereiche

## CMS-Hinweis

Statische Basisrouten sind im App Router angelegt. Seiteninhalte wie Kontakt-/Rechtstexte und weitere Footer-Seiten werden zusätzlich über das Pages-CMS (`pages`) gepflegt.
