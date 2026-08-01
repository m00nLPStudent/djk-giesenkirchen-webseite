# B13.4A - Additive Migration Manifest

## 1. Ziel und Scope

B13.4A bereitet ein kontrolliertes, ausschliesslich additives Migrationspaket fuer das Kernmodell Teams/Saisons, Spieler und Trainer vor. Ziel ist, die saisonale Wahrheit in `team_seasons`, `player_team_seasons` und `coach_team_seasons` zu staerken, ohne produktive Codepfade, RLS-Policies, Storage oder bestehende Daten zu veraendern.

## 2. Nicht enthaltene Module

Nicht Teil dieses Schritts sind News, Events, Membership, Beitraege, Vorstand, Sponsoren, CMS, RLS-Haertung und Storage-Bereinigung. Es gibt keine Code-Umschaltung, kein Dual Read und kein Dual Write.

## 3. Vorbedingungen

- B13.1, B13.2 und B13.3 sind freigegeben.
- Die Live-Exporte unter `docs/datenbank_docu/` liegen vor.
- Der Runtime-Code darf nur lesend zur Verifikation genutzt werden.
- Es wurde ein Datenbank-Backup erstellt.
- Der Preflight muss vor jeder Ausfuehrung ausgewertet werden.

## 4. Tatsachlich fehlende Zielspalten

Die additive Schema-Datei schliesst nur Spalten, die im B13.3-Zielmodell fuer `team_seasons` fehlen und in der aktuellen Laufzeit noch am Team-Master haengen:

- `fussball_de_matches_widget_url`
- `fussball_de_matches_url`
- `dfb_matches_widget_url`
- `fussball_de_table_widget_url`
- `fussball_de_table_url`
- `dfb_table_widget_url`
- `fussball_de_team_id`
- `fussball_de_competition_id`
- `fussball_de_club_id`
- `fupa_matches_widget_id`
- `fupa_table_widget_id`
- `fupa_club_url`

`season_id` ist bereits vorhanden und wird nicht erneut angelegt.

## 5. Bereits vorhandene Zielstrukturen

Schon vorhanden und deshalb nicht Teil der Schema-Erweiterung:

- `team_seasons.id`, `team_id`, `season_id`, `name_de`, `name_en`, `slug`, `age_group`
- `description_de`, `description_en`, `training_times_de`, `training_times_en`
- `team_image_url`, `contact_name`, `contact_email`, `contact_phone`, `contact_image_url`
- `fussball_de_matches_widget_id`, `fussball_de_table_widget_id`, `fussball_de_team_url`
- `is_active`, `sort_order`, `created_at`
- die Tabellen `players`, `player_team_seasons`, `coaches`, `coach_team_seasons`, `teams`, `seasons`, `departments`, `team_templates`

## 6. Additive Aenderungen

Die additive Schema-Proposal-Datei fuegt nur fehlende Textspalten zu `team_seasons` hinzu. Es gibt keine Typaenderung, kein `SET NOT NULL`, kein `DROP`, kein `RENAME`, keine Policy-Aenderung und keine neue Tabelle.

## 7. Backfill-Regeln

- `teams -> team_seasons` nur fuer die eindeutig markierte aktuelle Saison.
- `players.team_id -> player_team_seasons` nur, wenn keine aktive saisonale Zuordnung existiert und die Team-Saison eindeutig aufloesbar ist.
- `coaches.team_id -> coach_team_seasons` nur, wenn keine aktive saisonale Zuordnung existiert und die Team-Saison eindeutig aufloesbar ist.
- `players.photo_url -> players.image_url` nur, wenn `image_url` leer ist.
- `coaches.photo_url -> coaches.image_url` nur, wenn `image_url` leer ist.
- Bestehende nicht-leere Zielwerte werden nicht blind ueberschrieben.
- Mehrdeutige Faelle werden uebersprungen und ueber die Kontrollabfragen sichtbar gemacht.

## 8. Konfliktfaelle

- Mehr als eine aktive oder passende Team-Saison fuer denselben Teamkontext.
- Spieler oder Coaches mit `team_id`, aber ohne eindeutige aktuelle Team-Saison.
- Bereits vorhandene aktive Zuordnungen in `player_team_seasons` oder `coach_team_seasons`.
- Widerspruechliche Legacy-Werte, etwa abweichende `team_id`- oder Rollen-/Trikotnummernspaetwerte.
- Unterschiedliche Bildpfade zwischen `photo_url` und `image_url`.

## 9. Ausfuehrungsreihenfolge

1. Datenbank-Backup erstellen.
2. Preflight ausfuehren.
3. Ergebnisse exportieren.
4. Konflikte fachlich pruefen.
5. Additive Schema-SQL ausfuehren.
6. Schema erneut pruefen.
7. Backfill zunaechst in einer Transaktion testen.
8. ROLLBACK-Test.
9. Backfill kontrolliert ausfuehren.
10. Postcheck ausfuehren.
11. Website testen.
12. Admin-Dashboard testen.
13. Noch keine Legacy-Felder deaktivieren.
14. Noch keine Code-Umschaltung durchfuehren.

## 10. Kontrollabfragen

- aktuelle Tabellen und Spalten
- fehlende Zielspalten
- Datentypvergleich
- Constraintvergleich
- Indexvergleich
- doppelte `team_id + season_id` Kombinationen
- Spieler mit `players.team_id`, aber ohne `player_team_seasons`
- Coaches mit `coaches.team_id`, aber ohne `coach_team_seasons`
- widerspruechliche Teamzuordnungen
- fehlende aktuelle Saison
- Teams ohne Team-Saison
- Relationseintraege ohne gueltige Elternzeile
- Null-/Leerwerte fuer spaetere Pflichtfelder
- Backfill-Vorschau mit Counts

## 11. Rollback

Ein sicherer automatischer Rollback ist fuer die additive Phase nicht belegbar. Deshalb ist der Rollback-Entwurf bewusst nicht-destruktiv und verweist auf den Rueckweg ueber das Backup. Falls die Schema-Aenderung zwar geplant, aber noch nicht angewendet wurde, bleibt das Ruecksetzen des Arbeitsstands die sicherste Option. Wenn die Aenderung bereits angewendet wurde, wird vor jeder weiteren Entscheidung zuerst der Backup-Stand wiederhergestellt.

## 12. Risiken

- Mehrdeutige aktuelle Saison.
- Verwaiste Team-Saison-Referenzen.
- Versehentliche Mehrfachzuordnungen bei Spielern oder Coaches.
- Historische Legacy-Werte, die fachlich noch nicht eindeutig aufgeloest sind.
- Unterschiedliche Bild- und Rollenwerte zwischen Master und Relation.

## 13. Manuelle Freigabepunkte

- Freigabe der Preflight-Ergebnisse.
- Freigabe der exakten Liste fehlender `team_seasons`-Spalten.
- Freigabe des kontrollierten Backfill-Umfangs.
- Freigabe des ROLLBACK-Tests auf Backup-Basis.
- Freigabe der Nachkontrolle nach dem Backfill.

## 14. Testplan

### Teams

- Liste
- Create
- Edit
- Archivieren
- Reaktivieren
- oeffentliche Mannschaftsseite
- aktuelle Saison
- historische Saison

### Spieler

- Liste
- Create
- Edit
- Teamwechsel
- Trikotnummer
- Position
- Kapitaen
- Bild

### Coaches

- Liste
- Create
- Edit
- mehrere Teams
- mehrere Rollen
- Profil-Kachel-Verknuepfung
- Bild

### Scopes

- Superadmin
- Vorstand
- Jugendkoordinator
- Trainer mit Team
- Trainer ohne Team

### Regression

- Dashboard-Zahlen
- oeffentliche Website
- Sponsor-Modul
- News
- Events
- Login lokal
- Login Cloudflare

## 15. Go-/No-Go-Kriterien

### Go

- Preflight zeigt nur erwartete, erklaerte Luecken.
- Additive Schema-Aenderungen sind auf fehlende `team_seasons`-Spalten begrenzt.
- Backfill-Kandidaten sind eindeutig und konfliktarm.
- Postcheck zeigt keine neuen Konflikte.
- Build und Lint bleiben erfolgreich.

### No-Go

- Mehrdeutige aktuelle Saison.
- Widerspruechliche oder verwaiste Kernrelationen.
- Ueberraschende Datenkonflikte bei Bild-, Rollen- oder Trikotnummernfeldern.
- Jede Notwendigkeit fuer `DROP`, `DELETE`, RLS-Aenderungen oder Code-Umschaltung.
