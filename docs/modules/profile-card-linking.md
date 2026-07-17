# Modul: Profile Card Linking (B12.2a)

## Ziel

Vorstands- sowie Trainer-/Betreuerkacheln dauerhaft mit Admin-Profilen verknuepfen.

## Kernprinzip

- Technische Zuordnung nur ueber `admin_profile_id`
- E-Mail oder Name nur als einmalige Match-Hilfe
- Keine dauerhafte Autorisierung ueber E-Mail

## Tabellen

- `board_members.admin_profile_id` -> `admin_profiles.id`
- `coaches.admin_profile_id` -> `admin_profiles.id`

Beide Felder sind nullable, um bestehende Daten unveraendert weiterzufuehren.

## Migration

- Datei: `supabase/migrations/20260712_add_admin_profile_links_to_board_and_coaches.sql`
- Inhalt:
  - neue nullable UUID-Spalten
  - Foreign Keys mit `on delete set null`
  - Indexe auf `admin_profile_id`
  - partielle Unique-Indexe fuer eindeutige Zuordnung pro Kartentyp

Wichtig:

- Migration wird in dieser Phase nicht automatisch ausgefuehrt.
- Kein Backfill und keine RLS-Aenderung in derselben Migration.

## Superadmin-Verwaltung

- Zuordnungsfelder nur im Benutzer-Editor und nur fuer Superadmin sichtbar
- unzugeordnete Karten sind auswaehlbar
- bereits fremd zugeordnete Karten sind nicht auswaehlbar
- bestehende Zuordnung kann entfernt werden
- klare Fehlermeldungen bei Konflikten

## Match-Preview

Ein serverseitiger Preview-Helfer liefert nur Vorschlaege:

- `exact_match`
- `no_match`
- `ambiguous_match`
- `already_linked`

Regeln:

- exakte, normalisierte E-Mail-Vergleiche
- keine Teiltreffer
- keine automatische Verknuepfung
- keine vollstaendige E-Mail-Ausgabe in Diagnosen

## Own-Card-Regeln

Vorbereitete Helper pruefen true nur wenn:

- Datensatz existiert
- `admin_profile_id` gesetzt ist
- `admin_profile_id` dem aktiven Admin-Profil entspricht

Noch nicht Teil dieser Phase:

- kein hartes Enforcement auf allen Formularen
- kein globales Scope-Enforcement

## Nicht enthalten in B12.2a

- keine automatische Auth-E-Mail-Synchronisierung
- kein bestaetigter E-Mail-Change-Flow
- keine Aenderung an Login/Logout/Proxy

Folgephase erforderlich:

- E-Mail-Synchronisierung mit Bestaetigungs- und Rollback-Strategie, ohne die stabile `admin_profile_id`-Verknuepfung zu gefaehrden

Bekannte Einschränkung:
Vorstands- und Trainerkacheln können neu zugeordnet werden.
Das explizite Entfernen einer bestehenden Zuordnung auf NULL ist derzeit noch nicht zuverlässig und wird in einer späteren Korrekturphase behandelt.
