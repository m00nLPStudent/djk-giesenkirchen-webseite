# Changelog

## 2026-09-29

### Version 1.0.13 – Support-/Ticketsystem

- Der live verifizierte DB-/RPC-Unterbau ist durch eine serverseitige Core-, Repository-, Service- und Server-Action-Schicht angebunden. Eigene Ticketzugriffe, Superadmin-Verwaltung, Scope-Allowlist, IDOR-Schutz und die Sperre für Antworten auf abgeschlossene Tickets werden serverseitig durchgesetzt.
- Die responsive Dashboard-Oberfläche bietet eigene Ticketlisten, ein scopebegrenztes Create-Formular, sichere Detail- und Antwortansichten sowie die Superadmin-Verwaltung für Status, Priorität, Zuweisung und Wiederöffnung.
- Neue Tickets, Antworten und echte Statusänderungen nutzen nach erfolgreichem Business-RPC die zentrale, idempotente Dashboard-Notification- und Delivery-Pipeline. Actor-Ausschluss und permission-basierte Support-Empfänger verhindern Selbst- und Streuzustellungen.
- Alle drei Tickettypen besitzen datensparsame HTML-/Text-Renderer im zentralen Vereinslayout. `ticket_created`, `ticket_reply_created` und `ticket_status_changed` wurden kontrolliert aktiviert und erfolgreich live zugestellt; der geschützte Ticket-CTA wurde praktisch bestätigt.
- Die automatisierte Pre-Release-Prüfung und die manuelle Live-Abnahme mit Superadmin und berechtigtem Trainer sind bestanden. Der Permission-Guard-Hotfix für die Support-Liste und -Detailseite gehört zu Release 1.0.13; Ticket-Erstellung, Antworten, Status/Priorität/Zuweisung, Abschluss und Wiederöffnung wurden erfolgreich geprüft.
- Der Pre-Go-live-Status wurde ohne neue Release-Version synchronisiert: Punkt 7 ist einschließlich der freigegebenen Prüfungen 7.1 bis 7.8 und des technischen Repository-Audits 7.9 abgeschlossen. Es wurde kein neuer Produktcode-Go-live-Blocker gefunden; bekannte Baseline-Test-/ESLint-Probleme bleiben separat dokumentiert. DNS, SSL, Site-URL-Wechsel und finale domainabhängige Tests folgen als Cutover-Arbeiten unter den Roadmap-Punkten 8 ff.

## 2026-09-27

### Version 1.0.12 – Tischtennis-Redaktion und Kassierer-Berechtigungen

- Der Tischtennisvorstand besitzt alle fünf bestehenden `news.*`- und alle fünf bestehenden `events.*`-Permissions. News und allgemeine Termine werden in Listen, Detailzugriffen und Mutationen serverseitig ausschließlich auf das Department Tischtennis begrenzt.
- `public.news` und `public.events` wurden um nullable `department_id`-Zuordnungen mit Foreign Keys auf `departments(id) ON DELETE SET NULL` und partiellen Indizes ergänzt. Bestehende Teamzuordnungen wurden kontrolliert übernommen; globale Datensätze mit `NULL` bleiben erhalten.
- Create-Payloads erhalten den autorisierten Department-Scope serverseitig. Edit, Delete, Publish/Unpublish sowie News-/Event-Dokumentaktionen verweigern fremde Fußball- und Gesamtvereins-IDs.
- Die relevanten News-, News-Dokument- und Event-Read-Policies verwenden den zentralen Department-Permission-Vertrag. Öffentliche Veröffentlichungsfilter bleiben unverändert.
- Dem Kassierer wurden `settings.view` und `settings.edit` entzogen. Alle neun bestehenden `contributions.*`-Permissions bleiben erhalten; Superadmin bleibt vollständiger Beitragsmanager und Vorstand behält ausschließlich `contributions.view` und `contributions.export`.
- Preflight, Proposal und Postcheck wurden manuell erfolgreich ausgeführt. Der Postcheck lieferte 46 Zeilen, 10/10 Diagnoseblöcke, keine Scope-/Referenzabweichung und `overall_ok = true`; der Rollback wurde nicht ausgeführt.
- Der Trainervertrag aus Version 1.0.10 und der Jugendleitervertrag aus Version 1.0.11 bleiben unverändert.

### Version 1.0.11 – Jugendleiter-Berechtigungen und Mannschaftsspeicherung

- Der Jugendleiter besitzt nicht mehr `settings.view`; `settings.edit` bleibt ebenfalls unvergeben. Allgemeine Einstellungen, Seiten und Vereinskontakte gehören damit nicht zu seinem Zugriffsbereich.
- Die fünf vorhandenen Permissions `results.view`, `results.create`, `results.edit`, `results.delete` und `results.publish` wurden dem Jugendleiter zugeordnet. Der zentrale Results-Scope begrenzt `jugendleiter` beziehungsweise `youth_all` weiterhin ausschließlich auf Fußball; Tischtennis bleibt ausgeschlossen.
- `teams.create` wurde dem Jugendleiter ausdrücklich nicht zugeordnet. Bestehende Jugendmannschaften bleiben über `teams.edit` bearbeitbar.
- Ursache des Full-Save-Fehlers war der bisherige pauschale `team_seasons.upsert()`: Auch beim Bearbeiten einer vorhandenen Team-Season musste dadurch der mögliche INSERT-Pfad autorisiert werden.
- Der Schreibvertrag trennt jetzt eindeutig: Bestehende Team-Seasons werden per `UPDATE` mit `teams.edit` gespeichert; neue Team-Seasons werden erst nach serverseitiger Prüfung von `teams.create` per `INSERT` angelegt.
- Ein konkurrierender INSERT, der den Unique-Contract `(team_id, season_id)` verletzt, wird über PostgreSQL-Code `23505` kontrolliert und ohne unsicheren INSERT-/UPDATE-Fallback behandelt.
- RLS und die fünf bestehenden `team_seasons`-Policies blieben unverändert: INSERT erfordert weiterhin `teams.create`, UPDATE weiterhin `teams.edit`.
- Der Trainervertrag aus Version 1.0.10 einschließlich Spezialmutationen, Team-Scope, Full-Save-Sperre und fehlendem `teams.create` blieb unverändert.
- Read-only-Preflight, manuelles Proposal und Read-only-Postcheck wurden erfolgreich abgeschlossen; der Postcheck lieferte 71 Zeilen, 11/11 Ergebnisblöcke und `overall_ok = true`. Der vorhandene Rollback wurde nicht ausgeführt.
- Code und Datenbank sind für Version 1.0.11 vorbereitet. Deployment, manueller Node-Neustart und Live-Rollentest sind noch nicht erfolgt.

### Version 1.0.10 – Trainer-Berechtigungen für zugeordnete Mannschaften

- Ursache der bisherigen Speicherstörung war der allgemeine Mannschafts-Full-Save: Er führte auch reine Traineränderungen in einen `team_seasons`-Upsert, dessen INSERT-Pfad das bewusst nicht an Trainer vergebene `teams.create` benötigt.
- Trainer können im Dashboard ausschließlich ihre zugeordneten Mannschaften bearbeiten. Der Team- und Mannschaftssaison-Scope wird vor jeder freigegebenen Mutation serverseitig geprüft.
- Freigegeben sind Beschreibung, Trainingsübersicht und Trainingszeiten, Trainingsausnahmen, Kaderzuordnungen sowie Mannschaftskontakt. Kaderänderungen erfordern zusätzlich `players.edit` und schreiben ausschließlich in `player_team_seasons`.
- Stammdaten, Saison- und Jahrgangsstruktur, Wettbewerb, FUSSBALL.DE-Konfiguration, Medien sowie das Anlegen und Löschen von Mannschaften bleiben für die reine Trainerrolle schreibgeschützt.
- Höher privilegierte Rollen behalten ihre bestehenden Rechte. Service-Role-Zugriffe erfolgen weiterhin erst nach Session-, Permission- und Scope-Prüfung.
- Das Datenbank-Hardening für `current_admin_has_non_table_tennis_permission(text)` wurde über Read-only-Preflight, manuell ausgeführtes Proposal und erfolgreichen Read-only-Postcheck verifiziert. Der vorhandene Rollback wurde nicht ausgeführt; `overall_ok = true`.
- Der Stand ist lokal automatisiert validiert. Deployment, manueller Node-Neustart und abschließender Live-Rollentest stehen noch aus.

### Version 1.0.9 – Ergebnisse und öffentlicher Ergebnisticker

- `public.club_results` wurde über den kontrollierten Read-only-Preflight-/Proposal-/Postcheck-Ablauf eingeführt. Der vorhandene Rollback wurde nicht ausgeführt. RLS erlaubt öffentlich ausschließlich veröffentlichte Ergebnisse innerhalb des wirksamen Sichtbarkeitsfensters; administrative Schreibvorgänge bleiben serverseitig geschützt.
- Das Permission-System umfasst `results.view`, `results.create`, `results.edit`, `results.delete` und `results.publish`. Der Medienvertrag wurde um `purpose = result`, `entity_type = result` und `field = opponent_logo` erweitert.
- Berechtigte Vereinsverantwortliche können Fußball- und Tischtennisergebnisse zentral unter `/admin/results` erfassen, bearbeiten, veröffentlichen, zurückziehen und löschen.
- Die Verwaltung prüft Session, granulare `results.*`-Permission und Department-Scope serverseitig. Superadmin und technische Webmaster-Rolle verwalten beide Sportarten; die jeweiligen Department-Vorstände bleiben auf Fußball beziehungsweise Tischtennis begrenzt.
- Mannschaften werden ausschließlich aus aktiven Fußball- und Tischtennis-Mannschaftssaisons gewählt. Gegnername, Ergebnis, Heim-/Auswärtsstatus, Wettbewerb, Spielzeitpunkt und optionaler Anzeigezeitraum folgen dem live verifizierten `club_results`-Vertrag.
- Optionale Gegnerlogos verwenden die zentrale Medienbibliothek mit `purpose = result`, `entity_type = result` und `field = opponent_logo`.
- Ohne individuellen Zeitraum gilt weiterhin das Datenbankmodell vom Spielbeginn bis sieben Tage danach.
- Ein kompakter Ergebnisticker im öffentlichen Header zeigt aktuelle Fußball- und Tischtennisergebnisse abhängig vom Webseitenbereich: `mixed` auf allgemeinen Seiten, `football` beziehungsweise `table-tennis` in den Sportbereichen und `hidden` bei Gymnastikdamen und Behindertensport.
- Heim-/Auswärts-Mapping, zentral bezogenes Vereinslogo, Gegnerlogo mit neutralem Fallback und die bestehenden Sportart-Icons bilden eine kompakte Logo–Score–Logo-Darstellung. Desktop bleibt der Ticker rechts und kompakt, auf kleineren Geräten responsiv.
- Ab einem Ergebnis läuft der Ticker permanent mit 45 Sekunden linearer Laufzeit. Hover und Tastaturfokus pausieren; `prefers-reduced-motion` liefert eine statische horizontal erreichbare Darstellung. Beidseitiger Fade und `translate3d()` sorgen für einen weichen, compositor-freundlichen Lauf.

## 2026-09-26

### Version 1.0.8 – Kontaktdaten im Gesamtvorstand

- Auf den öffentlichen Vorstandskarten des Gesamtvereins werden hinterlegte Telefonnummern und E-Mail-Adressen jetzt direkt über Telefon- und E-Mail-Schaltflächen angezeigt.
- Telefonlinks verwenden das vorhandene normalisierte `tel:`-Format; E-Mail-Adressen öffnen über `mailto:` das bevorzugte E-Mail-Programm.
- Sind beide Kontaktdaten vorhanden, erscheinen beide Aktionen. Fehlt eine Angabe, wird nur die verfügbare Aktion dargestellt; ohne Kontaktdaten entsteht kein leerer Kontaktbereich.
- Die Daten stammen ausschließlich aus `board_members.phone` und `board_members.email`. Club-Scope, Aktivfilter, Kartendesign und Responsibilities-Dialog bleiben unverändert; es wurden keine Datenbank-, RLS-, Policy- oder Permission-Änderungen vorgenommen.
- Die zentrale Rollen-Vorlagenstruktur für allgemeine Seitenkontakte enthält jetzt `Besitzer` beziehungsweise `Owner`; Auswahl und DE-/EN-Vorbelegung folgen dem bestehenden Formularvertrag.
- Für den Gesamtvorstand steht die neue organisationsweite Funktion `Webmaster` in `board_roles` zur Verfügung.
- Die Board-Rolle wurde über den kontrollierten Preflight-/Proposal-/Rollback-/Postcheck-Ablauf ergänzt und live verifiziert. Es gab keine Schema-, RLS-, Policy- oder Permission-Änderung; die technische Adminrolle `webmaster` blieb separat und unverändert.
- Öffentliche Fußball- und Tischtennis-Mannschaftsseiten verwenden den gemeinsamen `TeamOverviewBackLink` für eine direkte, von der Browser-History unabhängige Rücknavigation zur fachlich passenden Mannschaftsübersicht.
- Im Fußball wird die Zielroute ausschließlich aus dem strukturierten Feld `teams.age_group` bestimmt: Junioren führen nach `/fussball/mannschaften/junioren`, Senioren/Herren nach `/fussball/mannschaften/senioren` und Damen/Frauen nach `/fussball/mannschaften/damen`. Unbekannte oder historische Werte fallen sicher auf `/fussball/mannschaften` zurück.
- Tischtennis-Mannschaftsseiten führen nach `/tischtennis/mannschaften`. Für diese Navigation war keine Datenbankänderung erforderlich.

## 2026-09-25

### Version 1.0.7 – Einheitliche Trainer- und Vorstandskarten

- Öffentliche Personen-, Trainer- und Vorstandskarten verwenden jetzt ein einheitliches vertikales Layout mit dem Bildbereich oberhalb der Informationen.
- Grid-basierte Kartenbreiten, harmonisierte Kartenhöhen und am Kartenende ausgerichtete Kontaktaktionen sorgen auf Mobile, Tablet und Desktop für eine konsistente Darstellung ohne horizontale Überbreite.
- Bestehende Mannschafts- und Mehrfachzuordnungen sowie die öffentliche Lizenzlogik bleiben erhalten; echte Trainerlizenzen werden weiterhin angezeigt und `Keine Lizenz` bleibt ausgeblendet.
- Board Responsibilities und der zugehörige Dialog bleiben unverändert erhalten. Die Darstellung berücksichtigt Gesamtverein, Fußball und Tischtennis sowie gemeinsam verwendete Personen- und Kontaktkarten.

## 2026-09-24

### Version 1.0.6 – Vorstandsaufgaben und optimierte Lizenzanzeige

- Public License Visibility: Der gespeicherte Wert `Keine Lizenz` wird auf öffentlichen Trainer-, Mannschafts- und Tischtennisseiten nicht mehr gerendert; echte Lizenzen bleiben unverändert sichtbar.
- Board Responsibilities: Vorstandsfunktionen können scope- und rollenbezogene Aufgaben über `organization_scope`, `department_id` und `role_id` erhalten, unabhängig von der jeweils zugeordneten Person.
- Die Dashboard-Bearbeitung und öffentliche Darstellung unterstützen Gesamtverein, Fußball und Tischtennis. Vorhandene Aufgaben öffnen sich über den kompakten Dialog `Aufgaben & Zuständigkeiten`; ohne Aufgaben erscheint kein Trigger.
- Mutationen sind serverseitig durch `board.edit`, Organisationsscope und Abteilungszuordnung abgesichert.
- Die neue Struktur `board_role_responsibilities` wurde über das abgeschlossene Preflight-/Proposal-/Rollback-/Postcheck-Verfahren eingeführt und verifiziert.

## 2026-09-20

### Version 1.0.5 – Dashboard-Terminverwaltung: bestehende Termine löschen

- Bestehende Termine können in ihrer Bearbeitungsansicht nach einer ausdrücklichen Sicherheitsabfrage dauerhaft gelöscht werden.
- Die Aktion ist in Oberfläche und Server Action durch `events.delete` geschützt; der Browser erhält keinen Service-Role-Zugriff.
- Nach erfolgreichem Löschen werden Terminübersicht und öffentliche Terminansichten aktualisiert. Zugehörige Dokumentzeilen und Media-Usage-Verknüpfungen folgen dem bestehenden Datenbankvertrag; zentrale Medien und Dateien bleiben erhalten.
- Die Funktion erscheint ausschließlich bei gespeicherten Terminen. Fehler verbleiben im Dialog und führen nicht auf eine tote Bearbeitungsroute.

### myTischtennis / click-TT – Spielplan-Korrektur

- UTC-/Offset-Zeitstempel aus click-TT werden mit `Europe/Berlin` korrekt in deutsche Ortszeit umgerechnet; Sommer- und Winterzeit folgen den Zeitzonenregeln ohne hartcodierten Stunden-Offset.
- Begegnungen werden unabhängig von der Providerreihenfolge nach Datum und Uhrzeit chronologisch sortiert.
- Ergebnisse abgeschlossener Begegnungen werden aus `matches_won` und `matches_lost` übernommen; technische Providerstatus wie `done` und `scheduled` werden nicht öffentlich ausgegeben, offene Begegnungen erscheinen als `Geplant`.
- Hallennummern werden verständlich als `Halle 1`, `Halle 2` usw. dargestellt; Heim- und Auswärtsspiele werden weiterhin ausschließlich über die externe Team-ID erkannt.
- Deduplizierung über Meeting-ID beziehungsweise den bestehenden stabilen Fallback und die defensive Behandlung fehlender optionaler Providerdaten bleiben erhalten.
- Die bestehende Ligatabelle wurde nicht verändert und bleibt funktionsfähig.
- Referenzprüfung bestanden: DJK VfL Giesenkirchen – TTC Waldniel IV am 06.09.2026 um 10:30 Uhr mit 4:6 sowie DJK VfL Willich III – DJK VfL Giesenkirchen am 11.09.2026 um 19:30 Uhr mit 6:4.
- Validierung: fokussierte Tischtennistests 43/43, vollständige Testsuite 1363/1363, Changed-Scope ESLint ohne Fehler, Production Build und TypeScript bestanden, `git diff --check` bestanden sowie sieben Referenzspiele live read-only verifiziert.
- Keine Änderungen an Datenbank, Supabase, SQL, Auth, Permissions oder der gespeicherten click-TT-Konfiguration.

### Version 1.0.4 – Saisonale Mannschaftsdaten und Tischtennis-Multi-Team

#### Fußball-Juniorenübersicht – Jahrgänge

- Auf der öffentlichen Fußball-Juniorenübersicht werden die Jahrgänge der aktuellen Mannschaftssaison angezeigt: ein einzelner Wert als `Jahrgang 2016`, mehrere Werte beispielsweise als `Jahrgänge 2014 · 2015`.
- Die Daten werden über die aktuelle `team_season` aus `team_season_year_groups` geladen, dedupliziert und aufsteigend sortiert.
- Mannschaften ohne hinterlegte Jahrgänge erhalten keine zusätzliche Zeile.
- Senioren, Damen und andere Sportbereiche bleiben unverändert.

#### Tischtennis – Mehrfachzuordnung von Spielern

- Ein Tischtennisspieler kann in der aktuellen Saison keiner, einer oder mehreren Mannschaften zugeordnet werden; ein zentraler Player-Master bleibt dabei die gemeinsame Person.
- Die Zuordnungen werden ohne Datenbankmigration über `player_team_seasons` verwaltet. Create unterstützt null, eine oder mehrere Zuordnungen; Edit lädt alle aktiven Zuordnungen.
- Änderungen werden differentiell synchronisiert. Beibehaltene Assignments bleiben unverändert und schützen ihre Metadaten wie Rückennummer, Position, Kapitänsstatus und Sortierung.
- Department- und Permission-Prüfungen erfolgen serverseitig; der Fußballbereich bleibt vollständig beim bestehenden Single-Team-Vertrag.
- Öffentliche Tischtenniskader zeigen denselben Player automatisch in allen zugeordneten Mannschaften.
- Der manuelle Browsertest wurde erfolgreich abgeschlossen.

#### Wartung – Tischtennis-Player Simon Georgens und Dominik Neeten

- Vier bisherige doppelte Tischtennis-Player-Master wurden in einem kontrollierten Verfahren vollständig entfernt, damit beide Personen anschließend jeweils einmal über die Multi-Team-Funktion neu angelegt werden können.
- Dabei wurden vier alte `player_team_seasons` und vier alte `media_asset_usages` entfernt; Contributions und Notifications waren nicht betroffen.
- Das referenzierte Media-Asset selbst wurde nicht gelöscht.
- Preflight, Proposal, Rollback und Postcheck liegen als versionierte SQL-Wartungsartefakte vor; der Postcheck war erfolgreich und bestätigte, dass keine verwaisten Assignment- oder Contribution-Referenzen verblieben sind.

## 2026-08-26

### B15.18/B15.19 abgeschlossen und B15.20 dokumentiert

- Notification-/Reminder-System einschließlich Audit-, Idempotenz- und Append-Härtung abgeschlossen; Cron-Produktivaktivierung als Go-live-Punkt zurückgestellt.
- zentrale Medienbibliothek in Spieler, Trainer, Vorstand, Kontakte, Mannschaften, News, Events, Sponsoren und Vereinschronik integriert.
- Sponsor-, Event-Dokument-, Chronik-, Board- und Publish-Berechtigungen gehärtet.
- Event-Mutationsclient, lokale Veröffentlichungszeitpunkte und Admin-Read für Event-Entwürfe korrigiert.
- aktuelle Roadmap, Abschlussübersicht und SQL-Register als zentrale Planungsgrundlage ergänzt.

## 2026-07-12

### Phase B12.2a Feste Profil-/Kachel-Verknuepfung fuer Vorstand und Trainer produktiv vorbereitet

- Migration vorbereitet (nicht ausgefuehrt): `supabase/migrations/20260712_add_admin_profile_links_to_board_and_coaches.sql`
- Verknuepfungsmodell auf `board_members.admin_profile_id` und `coaches.admin_profile_id` konkretisiert
- Superadmin-Editor in der Benutzerverwaltung um fixe Kachelzuordnung erweitert
- Serverseitige Repository- und Action-Helfer fuer Link/Unlink und Konfliktpruefung ergänzt
- E-Mail-Match-Preview als einmalige Zuordnungshilfe vorbereitet (`exact_match`, `no_match`, `ambiguous_match`, `already_linked`)
- Eigene verknuepfte Kachel im Profil read only sichtbar gemacht
- Keine SQL-Ausfuehrung, keine RLS-Aktivierung, kein Enforcement-Umbau

### Phase B12.2 Technische Grundlagen fuer Rollen-Scopes und Beitragsverwaltung vorbereitet (Analysephase)

- `AUTH_REQUIRED_FOR_ADMIN = true` bleibt aktiv
- `AUTH_ENFORCEMENT_ENABLED = false` bleibt aktiv
- Ist-Stand fuer Rollen, Permissions, Membership-Workflows und Content-Statusfelder analysiert
- Scope-Skeleton unter `src/lib/admin-auth/scopes/` vorbereitet (ohne Aktivierung im Runtime-Flow)
- SQL-Vorschlaege dokumentiert, aber nicht ausgefuehrt:
  - `docs/sql/b12-profile-links-proposal.sql`
  - `docs/sql/b12-team-scopes-proposal.sql`
  - `docs/sql/b12-membership-contributions-proposal.sql`
  - `docs/sql/b12-membership-contribution-payments-proposal.sql`
  - `docs/sql/b12-content-workflow-proposal.sql`
- Planungsdokument mit vorhanden/teilweise/fehlt-Matrix erstellt:
  - `docs/planning/b12-role-scope-matrix.md`
- keine Änderungen an Proxy-Enforcement, Login/Logout-Flow, SQL-Runtime oder Public-Seiten

## 2026-07-11

### Phase B11.2b-1 UI-Sichtbarkeit nach Permissions aktiviert (Enforcement bleibt aus)

- `AUTH_REQUIRED_FOR_ADMIN = true` bleibt aktiv
- `AUTH_ENFORCEMENT_ENABLED = false` bleibt aktiv
- Sidebar-Eintraege werden nun rein UI-seitig nach vorhandenen View-Permissions gefiltert
- Dashboard-Quick-Actions werden nun rein UI-seitig nach `requiredPermission` gefiltert
- Dashboard-Statistikkarten mit `requiredPermission` werden nun rein UI-seitig gefiltert
- sichtbare Neu-/Bearbeiten-/Löschen-/Matrix-/Speichern-Aktionen in den Adminmodulen werden nun nach bestehenden Permissions ausgeblendet
- noch kein Route-Enforcement und keine neuen Redirects
- Proxy, Middleware, Server Actions, Datenservices, SQL und RLS bleiben in dieser Phase unverändert
- nächste Phase: B11.2b-2 mit kontrollierter Absicherung einzelner Routen

### Phase B11.2a Route-/Permission-Mapping vollstaendig und auditierbar (Enforcement aus)

- `AUTH_REQUIRED_FOR_ADMIN = true` bleibt aktiv
- `AUTH_ENFORCEMENT_ENABLED = false` bleibt aktiv
- zentrale Route-Permission-Map in `src/lib/admin-auth/adminPermissionConfig.js` auf reale Adminrouten erweitert
- deterministisches Matching eingefuehrt: `resolveAdminRoutePermission(pathname)`
- dynamische Segmente (`:id`, `[id]`), `new`/`edit`, verschachtelte Unterrouten, Query-Parameter und Trailing-Slash werden robust verarbeitet
- Match-Reihenfolge abgesichert (spezifische Routen vor Elternrouten)
- Development-Diagnostik im Proxy erweitert: Log von `pathname`, `routePattern`, `permission`, `matched`, `isSuperadmin`
- unbekannte Adminrouten werden in Development gewarnt, aber nicht blockiert (weil Enforcement aus)
- Audit-Script hinzugefuegt: `npm.cmd run audit:admin-routes`
- Dashboard-Metadaten fuer spaetere Filterung vorbereitet (`requiredPermission` bei Stat-Items), ohne aktuelle UI-Filterung
- keine SQL-Aenderungen, keine Datenbankmigrationen, keine Public-Website-Anpassungen
- Regression nach der Einfuehrung des Permission-Enforcements vollstaendig behoben
- Runtime-Endzustand wieder stabil mit `AUTH_ENFORCEMENT_ENABLED = false`
- Stabilisierung gegengeprueft ueber Clean-Rebuild, Next.js-Neustart, Cloudflare-Tunnel-Neustart und aktualisierte Tunnel-URLs in Supabase
- Beobachtete `ChunkLoadError`-Meldungen und fehlgeschlagene `/_next/static`-Requests nur als Symptom dokumentiert, nicht als abschliessend bewiesene Einzelursache
- Erfolgreich gegengepruefte Module:
  - Benutzer
  - Rollen
  - Rechte
  - Matrix
  - Profil
  - News
  - Termine
  - Mannschaften
  - Trainer
  - Spieler
  - Sponsoren
  - Vereinsgeschichte
  - Einstellungen

### Phase B11.2 Rollen und Permissions produktiv durchgesetzt

- `AUTH_ENFORCEMENT_ENABLED = true` aktiviert
- zentrale Routenpruefung in `src/proxy.js` erweitert: fehlende Permission blockiert jetzt vor dem Rendern
- fehlende Route-Permission wird nach `/admin/unauthorized?reason=missing-permission&permission=<key>` umgeleitet
- `ADMIN_ROUTE_PERMISSIONS` fuer konkrete Admin-Unterrouten vervollstaendigt (new/edit/matrix/profile)
- unscharfe Zuordnungen auf spezifische Keys korrigiert (`permissions.view` statt `system.view`)
- unbekannte Routen/Nav/Dashboard-Actions werden im Enforcement nicht mehr pauschal erlaubt
- serverseitige Permission-Assertion fuer mutierende Actions hinzugefuegt:
  - `roles.edit` fuer Rollen-Schreiboperationen
  - `permissions.edit` fuer Permission-/Matrix-Schreiboperationen
  - `users.create`/`users.edit` fuer Benutzer-Schreiboperationen
- Sidebar und Dashboard-Schnellzugriffe lesen jetzt den echten Admin-Kontext statt statischem Fallback

### Phase B11.1.1 Zentrale Auth-Pflicht fuer den Adminbereich

- zentrale Middleware schirmt nun den gesamten Adminbereich vor dem Rendern ab
- ausgeloggte Besucher werden sicher nach `/admin/login?redirect=/admin/...` umgeleitet
- Admin-Profile und Aktivstatus werden serverseitig vor dem Rendern geprueft
- `AUTH_REQUIRED_FOR_ADMIN = true` bleibt aktiv, `AUTH_ENFORCEMENT_ENABLED = false` bleibt unveraendert

### Phase B11.1 Admin-Login verpflichtend aktiviert

- `AUTH_REQUIRED_FOR_ADMIN = true` gesetzt
- `AUTH_ENFORCEMENT_ENABLED = false` beibehalten
- `/admin` und Unterseiten verlangen jetzt eine Login-Session
- Fehlende Session wird sicher nach `/admin/login?redirect=/admin/...` umgeleitet
- Inaktive oder profillose Admin-Accounts werden nach `/admin/unauthorized` geleitet
- `/admin/login`, `/admin/forgot-password`, `/admin/set-password` und `/admin/unauthorized` bleiben erreichbar
- Permission-Enforcement bleibt bewusst aus; B11.2 folgt separat

## 2026-07-06

### Phase B6 Login/Logout/Auth-Flow vorbereitet (nicht verpflichtend)

- Auth-Schalter `AUTH_REQUIRED_FOR_ADMIN = false` eingefuehrt
- Session- und Auth-Kontext-Service unter `src/lib/admin-auth/adminSession.service.js` ergänzt
- Route `/admin/login` mit vorbereitetem Supabase-Login-Flow hinzugefuegt
- Route `/admin/forgot-password` mit vorbereitetem Reset-Flow hinzugefuegt
- ProfileMenu mit echter Logout-Struktur (signOut) und neutralem Fallback-Zustand erweitert
- AdminRouteGuard fuer spaetere Session-/Profil-/Aktivstatus-Pruefung vorbereitet
- Weiterhin keine verpflichtende Sperrung des Adminbereichs

### Phase B5 Permission-Engine vorbereitet (Enforcement aus)

- Permission-Engine, Guard-Strukturen und Fallbacks unter `src/lib/admin-auth/` vorbereitet
- Zentrale Permission-Config mit Schalter `AUTH_ENFORCEMENT_ENABLED = false` eingefuehrt
- Komponenten/Hooks fuer spaetere UI-Pruefung vorbereitet: `Can`, `usePermissions`, `AdminRouteGuard`
- Sidebar-Items und Dashboard-Quick-Actions mit Permission-Metadaten erweitert (ohne aktive Filterung)
- Route `/admin/unauthorized` als statische Info-Seite vorbereitet
- Weiterhin keine aktive Sperrung: alle Admin-Seiten bleiben erreichbar

### Phase B4 Permission-Verwaltung und Matrix

- Neue Admin-Route `/admin/permissions` mit modularer Permission-Verwaltung hinzugefuegt
- Neue Admin-Route `/admin/permissions/matrix` fuer Rollen-Permission-Zuordnungen hinzugefuegt
- Permissions-Liste mit Suche, Kategorie-Filter und Sortierung umgesetzt
- Statistik-Karten fuer Permissions, Kategorien und Zuordnungsstatus integriert
- Detaildialog sowie Erstellen/Bearbeiten fuer Permissions implementiert
- Matrix speichert Zuordnungen in `admin_role_permissions` (setzen/entfernen)
- Sidebar und Dashboard-Schnellzugriffe um "Rechte" erweitert
- Weiterhin offen: Sidebar-Rechtefilter, Route-Guards, systemweite Permission-Enforcement-Logik, Login/Logout

### Phase B3 Rollenverwaltung (admin_roles)

- Neue Admin-Route `/admin/roles` mit modularer Rollenverwaltung hinzugefuegt
- Rollenliste mit Suche, Statusfilter und Sortierung umgesetzt
- Statistik-Karten fuer Rollen, aktive/inaktive Rollen, Benutzerzuweisungen und Permissions ergänzt
- Detaildialog mit Read-Only-Ansicht fuer Benutzer und Permissions je Rolle implementiert
- Rolle erstellen/bearbeiten (Name, Key, Beschreibung, Sortierung, Aktiv) implementiert
- Aktivieren/Deaktivieren von Rollen implementiert
- Schutz in B3: Rolle `superadmin` kann nicht deaktiviert werden
- Sidebar und Dashboard-Schnellzugriffe um "Rollen" erweitert
- Weiterhin offen: Permission-Zuordnung bearbeiten, Benutzerzuweisung bearbeiten, Sidebar-Rechte, Route-Guards, Login/Logout

### Phase B2 Benutzerverwaltung (Admin-Profile)

- Neue Admin-Route `/admin/users` mit modularer Benutzerverwaltung hinzugefuegt
- Liste mit Suche, Status-/Rollenfilter und Sortierung implementiert
- Stat-Karten fuer Benutzer gesamt, aktiv/inaktiv und Rollen gesamt integriert
- Detaildialog mit Rollen und abgeleiteten Permissions (Read Only) umgesetzt
- Aktivieren/Deaktivieren von Admin-Profilen vorbereitet und angebunden
- Dialog "Neuer Benutzer" als B6-Vorbereitung ohne Auth-User-Erzeugung angelegt
- Sidebar und Dashboard-Schnellzugriffe um "Benutzer" erweitert

### Phase B1 vorbereitende Auth-/Rollenstruktur

- Service-Schicht fuer Admin-Auth/Rollen unter `src/lib/admin-auth/` vorbereitet
- Rollen-/Permission-Konstanten und Helper fuer spaetere Guards angelegt
- SQL-Seed-Vorschlag fuer Standardrollen und Permissions dokumentiert (`docs/sql/admin-auth-seed.sql`)
- Modul-Dokumentation fuer Admin-Auth hinzugefuegt (`docs/modules/admin-auth.md`)

## 2026-07-05

### Public website and admin settings finalized

Großer Meilenstein:

- öffentliche Website fachlich weitgehend abgeschlossen
- dynamischer Footer, Kontaktseite, Impressum, Datenschutz umgesetzt
- Pages-CMS, `club_settings` und `club_contacts` aktiv integriert
- Mitglied-werden-Formular und Mitgliedsanfragen mit Weiterleitungslogik umgesetzt
- Vereinsgeschichte mit RichText in Website und Admin umgesetzt
- News, Termine, wiederkehrende Termine und virtuelle Trainings stabil integriert
- Fußball-Übersichtsseiten und Mannschaftsseiten final strukturiert
- Vorstand, Trainer und Sponsoren produktiv angebunden
- Admin-Einstellungen als zentrale Pflegeoberfläche abgeschlossen

## Frühere Meilensteine

- Projektbasis mit Next.js App Router und Supabase aufgebaut
- modulare Admin-Bausteine eingeführt
- saisonfähige Mannschaftsstruktur umgesetzt
- Events-Modul um Wiederholung, Dokumente und virtuelle Trainings erweitert
