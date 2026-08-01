# B13.3 - Verbindliches Datenbank-Zielmodell

Status: Zielmodell auf Basis von [B13.1](b13-1-datenbankanalyse.md), [B13.2](b13-2-code-database-mapping.md) und den CSV-Exporten in `docs/datenbank_docu`

## 1. Ziel und Grundsaetze

Das Zielmodell trennt stabile Stammdaten, saisonale Zuordnungen und operatives Content-/Workflow-Verhalten konsequent voneinander. Die Runtime-Analyse zeigt, dass die aktuelle Datenbasis bereits tragfaehige Bausteine hat; das Zielmodell schiebt nur die Duplikate und Legacy-Felder in eine klare Uebergangs- oder Abhaengigkeitsschicht. Keine Tabelle wird in dieser Phase geloescht.

## 2. Zielmodell Teams/Saisons

`teams` bleibt die stabile Team-Identitaet mit Name, Slug, Abteilung und Aktivstatus. Saisonbezogene Inhalte wie Age Group, Beschreibungen, Kontakt, Bild und externe Widgets gehoeren in `team_seasons`. Der aktuelle Text-Saisonwert in `teams.season` ist nur noch ein Uebergangsfeld und soll spaeter verschwinden. Archivierte Mannschaften bleiben als inaktive Datensaetze erhalten; harte Loeschungen sind nicht Teil dieses Zielmodells.

## 3. Zielmodell Spieler

`players` ist der Personenstamm fuer Spieler. Die kanonische Mannschaftszuordnung, Shirt Number, Position, Captain-Flag und Sortierung liegen in `player_team_seasons`. `players.image_url` ist der bevorzugte Bildpfad; `photo_url` bleibt nur als Kompatibilitaetsalias. `name_de`, `name_en`, `position`, `jersey_number`, `team_id` und `is_captain` sind keine Stammdaten mehr.

## 4. Zielmodell Trainer/Betreuer

`coaches` ist der Personenstamm fuer Staff-Mitglieder. Die kanonische Team-Saison-Zuordnung und die Rolle liegen in `coach_team_seasons`. `coaches.team_id`, `team_slug`, `team_name`, `role`, `role_de`, `role_en` und `sort_order` werden aus dem Master in die Saisonzuordnung verschoben oder nur noch als Uebergangsfelder gehalten. Die eigene Staff-Kachel bleibt ueber `admin_profile_id` mit `admin_profiles` verknuepft.

## 5. Zielmodell Training

`team_training_times` bleibt die kanonische wiederkehrende Trainingsstruktur. `team_training_exceptions` und `club_closure_periods` bleiben die Ausnahmeschicht fuer den Kalender. Die textlichen Trainingsfelder in `teams` sind nur noch ein uebergangsgesteuerter Presentational Cache; langfristig wird die planbare Trainingszeit nur noch aus den Trainings-Relationen abgeleitet.

## 6. Zielmodell News/Events

News und Events bleiben eigenstaendige Content-Tabellen. `news` fuehrt Titel, Teaser, Inhalt, Slug, Autor, Teambezug und Publikationsstatus. `category_key` ist die kanonische Kategoriequelle; `category` ist nur Uebergangssicht und wird spaeter entfernt. `scheduled_at` bleibt nicht als Ziel des Zielmodells, weil die kuenftige Workflow-Steuerung erst in einem gesonderten Schritt eingefuehrt wird. Events behalten Recurrence, Ort, Teambezug, Dokumente und Publikationsstatus in einer Tabelle.

## 7. Zielmodell Vorstand/Sponsoren/CMS

`board_members` bleibt der Personstamm fuer den Vorstand, `board_roles` bleibt das Rollenlexikon. Rollenbezeichnung ist langfristig ueber `board_roles` zu ziehen, nicht ueber den Vorstandssatz selbst. Sponsoren bleiben separat in `sponsors` und `sponsor_categories`. CMS-Inhalte bleiben bewusst getrennt: `pages`, `club_settings`, `club_contacts` sowie die Historien-Tabellen `club_history_pages`, `club_history_images` und `club_history_milestones`.

## 8. Zielmodell Membership

`membership_requests` bleibt getrennt von Beitragsmodellen. Die Anfrage ist der fachliche Erstkontakt, nicht der Beitragsdatensatz. `membership_request_recipients` bleibt die Routing-Konfiguration. Snapshot-Felder wie `processed_by` und `forwarded_to_*` bleiben vorerst erhalten, bis die Audit- und Workflow-Entscheidung fuer das spaetere Zielmodell getroffen ist. Beitrags-Tabellen werden in diesem Schritt bewusst noch nicht eingefuehrt.

## 9. Zielmodell Admin/Rollen/Scopes

`admin_profiles`, `admin_roles`, `admin_permissions`, `admin_user_roles` und `admin_role_permissions` sind die Kernstruktur fuer Zugriff und Sichtbarkeit. Rollen und Permissions bleiben erhalten, die Scopes werden weiter aus Rollen, Admin-Profilen und Teamzuordnungen abgeleitet. Es gibt keine parallele zweite Wahrheit fuer Berechtigungen. Board- und Staff-Links laufen weiterhin ueber `admin_profile_id` und nicht ueber duplizierte Personenspeicher.

## 10. Zielmodell Storage

Die Buckets `media`, `news-documents` und `events-documents` bleiben. Die Unterordner bleiben modulspezifisch, die Dateinamen bleiben vorhersehbar und vom Modul ableitbar. Die Datenbank speichert sowohl Pfad als auch Public-URL, damit die Website und der Admin konsistent bleiben. Speicherobjekte werden nicht in diesem Schritt bereinigt.

## 11. RLS-Zielstrategie

Public-Content-Tabellen werden auf Public-Read mit serverkontrolliertem Write ausgerichtet. Admin- und Konfigurationstabellen werden auf authentifizierten Read plus serverseitig kontrolliertem Write ausgerichtet. Systemtabellen in `auth` und `storage` bleiben system- oder service-role-gesteuert. RLS und Server-Permissions sind zwei getrennte Schutzschichten, keine konkurrierenden Wahrheiten.

### Zielklassen fuer Public-Tabellen

- PUBLIC_READ_SERVER_WRITE: `teams`, `team_seasons`, `player_team_seasons`, `coach_team_seasons`, `players`, `coaches`, `board_members`, `news`, `news_documents`, `events`, `event_documents`, `pages`, `club_contacts`, `club_settings`, `club_history_pages`, `club_history_images`, `club_history_milestones`, `sponsors`, `sponsor_categories`, `team_training_times`, `team_training_exceptions`, `club_closure_periods`
- AUTHENTICATED_READ_SERVER_WRITE: `admin_profiles`, `admin_roles`, `admin_permissions`, `admin_user_roles`, `admin_role_permissions`, `membership_request_recipients`
- SERVER_ONLY: `auth.*`-Systemtabellen und service-role-gebundene Verwaltungsoperationen
- PUBLIC_INSERT_RESTRICTED: `membership_requests`
- SYSTEM_MANAGED: `storage.objects`, `storage.buckets` und sonstige Storage-Systemtabellen

## 12. Beibehaltene Tabellen

KEEP_AND_HARDEN:
- public.admin_permissions
- public.admin_profiles
- public.admin_role_permissions
- public.admin_roles
- public.admin_user_roles
- public.board_members
- public.board_roles
- public.club_closure_periods
- public.club_contacts
- public.club_history_images
- public.club_history_milestones
- public.club_history_pages
- public.club_settings
- public.coach_team_seasons
- public.coaches
- public.departments
- public.event_documents
- public.events
- public.membership_request_recipients
- public.membership_requests
- public.news
- public.news_documents
- public.pages
- public.player_team_seasons
- public.players
- public.seasons
- public.sponsor_categories
- public.sponsors
- public.team_seasons
- public.team_templates
- public.team_training_exceptions
- public.team_training_times
- public.teams

KEEP:
- auth.audit_log_entries
- auth.custom_oauth_providers
- auth.flow_state
- auth.identities
- auth.instances
- auth.mfa_amr_claims
- auth.mfa_challenges
- auth.mfa_factors
- auth.oauth_authorizations
- auth.oauth_client_states
- auth.oauth_clients
- auth.oauth_consents
- auth.one_time_tokens
- auth.refresh_tokens
- auth.saml_providers
- auth.saml_relay_states
- auth.schema_migrations
- auth.sessions
- auth.sso_domains
- auth.sso_providers
- auth.users
- auth.webauthn_challenges
- auth.webauthn_credentials
- storage.buckets
- storage.buckets_analytics
- storage.buckets_vectors
- storage.migrations
- storage.objects
- storage.s3_multipart_uploads
- storage.s3_multipart_uploads_parts
- storage.vector_indexes

## 13. Konsolidierte Tabellen

Auf Tabellenebene ist in B13.3 keine harte Konsolidierung vorgesehen. Die Konsolidierung findet auf Spaltenebene statt, indem saisonale Attribute aus Mastertabellen in die jeweiligen Relationstabellen verschoben werden.

## 14. Legacy-Uebergangsfelder

- `teams.season`
- `players.photo_url`
- `players.name_de` und `players.name_en`
- `coaches.team_slug` und `coaches.team_name`
- `coaches.name`
- `coaches.photo_url`
- `coaches.role` sowie `coaches.role_de` und `coaches.role_en`
- `board_members.role_de` und `board_members.role_en`
- `news.category`
- `membership_requests.processed_by`
- `membership_requests.forwarded_to_*`

## 15. Spaeter entfernbaren Felder

- `teams.season`
- `players.position`
- `players.jersey_number`
- `players.name_de` und `players.name_en`
- `news.scheduled_at`
- die Vorstandssnapshot-Felder in `board_members`
- die Rollen-Snapshots in `coaches`

## 16. Ungeklaerte fachliche Entscheidungen

- Soll `membership_requests.processed_by` final als Text-Snapshot bleiben oder spaeter auf einen Profil-FK umgestellt werden?
- Soll das Departments-Modell als reine Abteilungstaxonomie oder als weitergehende Struktur fuer Teams verstanden werden?
- Soll die News-Kategorie langfristig ueber reine Keys oder ueber eine eigene Kategorientabelle aufgeloest werden?
- Soll der Staff-Rollenwechsel historisiert werden, oder reicht die Relation auf `coach_team_seasons`?

## 17. Abhaengigkeiten

- Teams haengen an `departments`, `team_seasons`, `player_team_seasons` und `coach_team_seasons`
- Spieler und Coaches haengen an ihren saisonalen Relationstabellen
- Training haengt an `team_seasons`, `team_training_times`, `team_training_exceptions` und `club_closure_periods`
- News und Events haengen an Dokument-Tabellen und Storage-Buckets
- Membership haengt an Teams und Recipient-Config
- Admin/Rollen/Scopes haengen an `admin_profiles`, `admin_roles` und den Bridge-Tabellen

## 18. Empfohlene Migrationsreihenfolge

1. Sicherheitskopie und Abnahmekriterien
2. Additive Zielstrukturen in den bestehenden Zieltabellen verankern
3. Backfill der saisonalen Zuordnungen und Snapshot-Felder
4. Dual Read fuer die neue Zielsicht
5. Dual Write fuer Schreibpfade mit hoher Nutzerlast
6. Code-Umschaltung auf die neue kanonische Quelle
7. Validierung gegen die vorhandene Website und das Admin-Dashboard
8. Legacy Read abschalten
9. Legacy Write abschalten
10. Spaetere Entfernung der uebergangsfelder
11. RLS-Haertung auf das Zielprofil
12. Storage-Bereinigung

### Risiken und Rollback

- Sicherheitskopie: Risiko niedrig, Rollback ueber Restore
- Additive Zielstrukturen: Risiko niedrig, Rollback ueber Entfernen der neuen Pfade
- Backfill: Risiko mittel, Rollback ueber erneutes Backfill aus Legacy-Quellen
- Dual Read: Risiko mittel, Rollback ueber Rueckschalten des Lesepfads
- Dual Write: Risiko hoch, Rollback nur mit enger Validierung von Schreibkonflikten
- Code-Umschaltung: Risiko hoch, Rollback ueber Feature-Flag oder Rueckstellung des Deployments
- Validierung: Risiko niedrig, Rollback nicht noetig
- Legacy Read/Write abschalten: Risiko hoch, Rollback durch Wiederaktivierung des alten Pfads
- Spaetere Entfernung: Risiko mittel, Rollback nur ueber Backfill-Backup
- RLS-Haertung: Risiko hoch, Rollback ueber kontrollierte Policy-Rollback-Variante
- Storage-Bereinigung: Risiko mittel bis hoch, Rollback nur ueber objektbezogene Wiederherstellung

## 19. Rollback-Grundsaetze

- Jede additive Phase muss vollstaendig revertierbar bleiben
- Keine Phase darf historische Daten verlieren
- Dual Write bleibt so lange aktiv, bis mindestens eine erfolgreiche Verifikation ueber mehrere reale Inhalte vorliegt
- Legacy-Felder werden erst abgeschaltet, wenn Public-Website und Admin-Dashboard parallel gegen die Zielquelle validiert sind
- RLS wird nur schrittweise verschaerft, nie in einem grossen Sprung

## 20. Freigabekriterien fuer B13.4

- Zieltabellen-Matrix und Zielspalten-Matrix liegen vollstaendig vor
- Alle Kernentscheidungen fuer Teams, Spieler, Coaches, Training, News, Events, CMS, Membership, Admin und Storage sind dokumentiert
- Keine offene Entscheidung blockiert die additive Migration
- Public-Website und Admin-Dashboard bleiben ueber die Zielsicht migrierbar
- Alle Legacy-Übergangsfelder sind benannt
- Build und Lint sind vor der naechsten Phase erneut geprueft

## Zusammenfassung der Zielentscheidungen

- Kanonische Teamquelle: `teams` fuer Identitaet, `team_seasons` fuer saisonale Wahrheit
- Kanonische Spieler-Team-Quelle: `player_team_seasons`
- Kanonische Coach-Team-Quelle: `coach_team_seasons`
- RLS-Zielstrategie: Public Read, Server Write, Authenticated Admin Read, System-only fuer `auth` und `storage`
- Storage-Zielstrategie: Buckets bleiben, Public Read fuer Medien-Downloads, Server Write fuer Uploads und Loeschungen
- Konkrete Zielrichtung: Stammdaten bleiben stabil, Saison- und Rollenlogik wandert konsequent in Relationstabellen
