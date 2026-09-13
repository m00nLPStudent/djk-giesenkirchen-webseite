# Priorität 7 – Database/Season Cleanup Contract

Status: **PRIORITY 7 COMPLETE / FINAL POSTCHECK AND MANUAL OPERATOR REVIEW PASSED**

Der getrennte Media-/Storage-Schritt ist in
[`priority7-media-storage-cleanup-execution-plan.md`](priority7-media-storage-cleanup-execution-plan.md)
dokumentiert. Der freigegebene manifestbasierte Lauf entfernte 11 Usages, 33
Assets und alle 109 Test-/Legacy-Storage-Objekte. Die fünf Buckets und die
gesamte Keep-Foundation blieben erhalten. Der vollständige Pfad-/ID-Vertrag
bleibt wegen personenbezogener Legacy-Dateinamen ausschließlich im
git-ignorierten privaten Manifest. Der finale Priority-7-Gesamtpostcheck wurde
vollständig bestanden (`final_sql_pass = true`).

Live-Preflight-Korrektur: P7.09 enthielt zunächst die repositoryseitig nur als früheres additives Proposal beziehungsweise Zielmodell dokumentierte Relation `public.coach_staff_roles`. Diese Relation existiert live nicht. Trainer- und Betreuerfunktionen werden aktuell über `coach_team_seasons.role_de`/`role_en` sowie für teamlose oder historisierte Coaches über die Fallbackfelder `coaches.role`, `role_de` und `role_en` modelliert. P7.09 zählt deshalb nun `coach_team_seasons`; die bereits erfolgreichen Resultsets P7.01–P7.08 bleiben gültig und ausschließlich P7.09 ist erneut manuell auszuführen. Dadurch wurde weder die Datenbank noch Produktcode verändert.

## Operator-Ziel und Sicherheitsgrenze

Der Betreiber plant einen vollständigen fachlichen Neuaufbau. Später sollen alle Test-/Demodaten entfernt werden; genau ein bestehender, aktiver Superadmin-Account muss einschließlich Auth-User, `admin_profiles`-Zeile und Superadmin-Rollenbindung funktionsfähig erhalten bleiben. Rollen, Permissions, Departments, technische Konfiguration, Schema, RLS, Policies, Grants, Funktionen, Trigger und notwendige Storage-Buckets bleiben unverändert.

Der Live-Preflight, private Recovery-Export, Dry Run, Core-Proposal und
Read-only-Postcheck wurden in der freigegebenen Reihenfolge erfolgreich
abgeschlossen. Decision-Preflight, Storage-Manifest und Recovery-Plan bilden
den dokumentierten Sicherheitsvertrag. `TRUNCATE CASCADE` war und bleibt
ausdrücklich ausgeschlossen. Auth- sowie Media-/Storage-Cleanup wurden als
getrennte, ausdrücklich freigegebene Stufen abgeschlossen. Der finale
Gesamtpostcheck sowie Superadmin-Login, Profiltest ohne Avatar und Public Smoke
sind bestanden.

## Repositorybasierter Benutzervertrag

- `admin_profiles.id` ist zugleich die zugehörige `auth.users.id`.
- Rollenbindungen liegen in `admin_user_roles`; Rollendefinitionen in `admin_roles`.
- Berechtigungen liegen in `admin_permissions`; die Matrix in `admin_role_permissions`.
- Die Benutzeranlage lädt über die serverseitige Supabase Admin API ein, erzeugt danach Profil und Rollenbindungen und kompensiert Teilerfolge.
- Die Auth-User-Löschung verwendet serverseitig `auth.admin.deleteUser(userId)`. Der spätere Massen-Cleanup darf diesen Ablauf nicht ohne einen separat geprüften Dependency-Vertrag vervielfachen.
- Der Operator wird nicht über eine hartcodierte UUID aufgelöst. P7.03 verlangt genau einen aktiven Auth-/Profil-Benutzer mit aktiver Rolle `superadmin` und gibt nur dessen technische UUID aus.

Stop-Bedingung: P7.03 liefert nicht exakt einen Kandidaten oder eine der Integritätsflags ist falsch. Dann wird kein Cleanup-Proposal entworfen.

## MUST KEEP

| Relation/Objekt | Zweck | Count | Abhängigkeiten | Behandlung | Begründung |
|---|---|---:|---|---|---|
| `auth.users` / `admin_profiles` | Login-/Profilmodell | Live-Preflight | gleiche UUID; zahlreiche FKs | exakt Operator behalten | Dashboardzugang |
| `admin_user_roles` | Benutzerrollen | Live-Preflight | User + Rolle | Operatorbindung behalten | Superadmin-Vertrag |
| `admin_roles` | Rollenstamm | Live-Preflight | Permissionmatrix/Userrollen | vollständig behalten | Systemfoundation |
| `admin_permissions` | Permissionstamm | Live-Preflight | Rollenmatrix | vollständig behalten | Systemfoundation |
| `admin_role_permissions` | Rollen-/Permissionmatrix | Live-Preflight | Rollen + Permissions | vollständig behalten | Autorisierung |
| `departments` | Fachbereichsstruktur | Live-Preflight | Teams/Personen/Sections | vollständig behalten | stabile Slugs und Scopes |
| Kategorie-/Lookup-Tabellen | News/Event/Download/Sponsor/Teamtypen | Live-Preflight | fachliche Parents | grundsätzlich behalten | technische Stammdaten |
| `club_settings` | System-/Websitekonfiguration | Live-Preflight | öffentliche Darstellung | behalten | App-Konfiguration |
| `membership_request_recipients` | konfigurierbare Zuständigkeits-/Routing-Foundation | P7.01 | Membership-Workflow | behalten | keine Anfrage-Kinddaten |
| Notification-E-Mail-Settings | globaler Systemvertrag | Live-Preflight | Delivery-Logik | behalten | keine Fachdaten |
| RLS/Policies/Grants/Funktionen/Trigger | Security Foundation | P7.20–P7.21 | gesamtes Schema | unverändert | Sicherheitsvertrag |
| `storage.buckets` | Storage Foundation | P7.16 | Storage-Objekte | Buckets behalten | Infrastruktur |
| `public/images/club-logo.png` | Repository-Asset | n/a | keine DB-Relation | behalten | kein Storage-Testmedium |

Das aktuelle Superadmin-Profilbild ist ausdrücklich **kein** Keep-Ziel. Der
Login-, Profil- und Rollenvertrag bleibt auch ohne Bild funktionsfähig.
`admin_profiles.profile_image_media_asset_id` besitzt `ON DELETE SET NULL`;
die zugehörige `admin_profile`/`avatar`-Usage muss im getrennten Media-Schritt
kontrolliert entfernt werden. Im Core-Proposal findet weiterhin keine
Media-Löschung und daher auch keine Avatar-Mutation statt.

## SAFE DELETE CANDIDATE – vorbehaltlich Live-FKs

| Relation/Gruppe | Zweck | Count | Abhängigkeiten | geplante Behandlung | Begründung |
|---|---|---:|---|---|---|
| Teams, Team-Seasons, Year-Groups | Mannschafts-/Saisonbestand | P7.08 | Kader, Training, Provider | später kontrolliert leeren | fachlicher Neuaufbau |
| Player-/Coach-Team-Seasons | Personenzuordnung und aktuelle Trainer-/Betreuerfunktion | P7.08/P7.09 | Personen + Team-Seasons | vor Parents | FK-Kinder; `coach_staff_roles` existiert live nicht |
| Players, Coaches, Board Members | fachliche Personen | P7.09 | Media/Beiträge/Relationen | später kontrolliert leeren | Testpersonen |
| News/Documents, Events/Documents, Sponsors | Inhalte | P7.10 | Media Usage/Kategorien | später kontrolliert leeren | Testinhalte |
| Training Times/Exceptions | Training | P7.11 | Teams/Team-Seasons | vor Team-Parents | fachliche Termine |
| Media Usages/Assets | zentrale Medien | P7.12/P7.16 | viele fachliche Owners/Storage | Usage vor Asset; Storage separat | keine Orphans |
| Downloads | Dokumentzuordnung | P7.10 | Kategorie + Media Asset RESTRICT | vor Media Asset | FK-Abhängigkeit |
| Membership Requests | Anfragen | P7.13 | Team-Season/Userbezüge | später kontrolliert leeren | personenbezogene Testdaten |
| Contributions/Payments | Beitrag/Zahlung | P7.13 | Player/Season; NO ACTION | Payment vor Contribution vor Player | blockierende FKs |
| Notifications/Deliveries/Preferences | Benutzerkommunikation | P7.14 | Auth User; Delivery CASCADE | vor Nicht-Operator-Usern | Testfachdaten |
| External Competitions/Widgets | saisonaler Providervertrag | P7.08 | Team-Season CASCADE | explizit vor/mit Team-Season | Testkonfiguration |

„Safe“ bedeutet hier nur fachlich als Löschkandidat bestätigt. Die tatsächliche sichere Reihenfolge und jede Ausnahme werden erst aus P7.17/P7.18 abgeleitet.

## Finale Operatorentscheidungen

| Relation/Gruppe | Zweck | Count | Abhängigkeiten | finale Entscheidung | Grund |
|---|---|---:|---|---|---|
| `notification_audit` | Security-/Operationshistorie | 25 | lose technische Bezüge | MUST KEEP | append-only Monitoringhistorie |
| `department_sections` | redaktionelle Section-Inhalte | 2 | Department RESTRICT, Media SET NULL | DELETE | dashboardseitig neu aufbaubar |
| `department_training_times` | fachliche Trainingszeiten | 2 | Department RESTRICT | DELETE | dashboardseitig neu aufbaubar |
| Club History/Page CMS | redaktioneller Aufbaubestand | 1 / 14 / 0 sowie 2 Pages | Images/Milestones vor Parent | DELETE | vollständiger Neuaufbau |
| `club_contacts` | öffentliche Vereinskontakte | 5 | Media SET NULL | DELETE | keine Routing-Foundation |
| `club_closure_periods` | Vereinsschließzeiten | 0 | Trainingsberechnung | MUST KEEP / NO DELETE | Null-Guard bleibt fail-closed |
| `seasons` | Saisonstamm | 2 | Team-Seasons/Beiträge | MUST KEEP | `2026/2027` und `2027/2028` bleiben |
| Media Assets/Usages/Storage-Objekte | fachliche Testmedien | 33 / 19 / 109 | polymorphe Usages und Storage | DELETE IN SEPARATE MANIFEST STAGE | kein Core-SQL- oder Bucket-Delete |
| Nicht klassifizierte Public-Tabellen | unbekannt/neu | P7.22 | Live-FKs | verpflichtende Einzelentscheidung | fail-closed |

## Abhängigkeitsgraph und Risiken

P7.17 inventarisiert alle Public-/Storage-FKs samt `CASCADE`, `SET NULL`, `RESTRICT` und `NO ACTION`. P7.18 liefert nur einen diagnostischen Kandidatengraph; er ist kein ausführbarer Löschplan. Bereits repositoryseitig sichtbar sind unter anderem:

- Notification Deliveries → Notifications: `ON DELETE CASCADE`.
- Notification Preferences/Notifications → Auth User: `CASCADE`; Actor-Referenzen teils `SET NULL`.
- Media Usages → Media Assets: `RESTRICT`; fachliche Media-FKs überwiegend `SET NULL`.
- Downloads → Media Assets/Download Categories: `RESTRICT`.
- Contributions/Payments: relevante FKs mit `NO ACTION`, daher explizite Child-first-Reihenfolge.
- Team-Season Year Groups und externe Competition-Konfiguration → Team Season: `CASCADE`.
- Department Sections/Training → Departments: `RESTRICT`; Departments bleiben ohnehin erhalten.
- Department-Master an Teams/Players/Coaches: `SET NULL`, darf nicht als Löschmechanismus für Departments missverstanden werden.

Risiken: Superadmin-Kaskaden, blockierende FKs, Trigger-Seiteneffekte, Media-Usage/Storage-Orphans, Audit-Retention, CMS-Singletons, Schließzeiten sowie Legacy-Buckets. Kein späteres Proposal darf Systemtabellen durch Namensmuster oder breit wirkende Cascades erfassen.

## Graphen nach Fachdomäne

- Team/Season: Department → Team → Team Season → Year Groups/Kader/Trainer/Training/External Competition.
- Personen: Player/Coach/Board/Contact → saisonale Rollen, Beiträge und Media-Zuordnungen.
- Content: Kategorien bleiben; News/Event/Sponsor/Download/History-Inhalte und Dokumente sind getrennt zu ordnen.
- Training: Ausnahmen vor Teamzeiten; Departmentzeiten werden separat vor ihrer erhaltenen Department-Foundation gelöscht; Closure Periods bleiben bei bestätigtem Count 0.
- Media/Storage: fachliche Owner → Media Usage → Media Asset → konkretes Storage-Objekt. DB und Storage werden später koordiniert, aber nicht blind gekoppelt.
- Membership/Contribution: Requests sind eigenständig; Payments → Contributions → Player/Season.
- Notification: Deliveries vor Notifications; Preferences vor der späteren Auth-Stufe; Audit bleibt ausdrücklich erhalten.
- Provider: Competition-Konfiguration → Team Season; Football-Widgetfelder auf Team Season werden mit den Team-Seasons entfernt, nicht zweckentfremdet.

## Preflight-Anleitung

1. Ausschließlich [`b15-priority7-database-cleanup-preflight-readonly.sql`](../sql/b15-priority7-database-cleanup-preflight-readonly.sql) im Supabase SQL Editor ausführen.
2. Exakt 22 Resultsets P7.01–P7.22 vollständig exportieren.
3. Keine personenbezogenen Spalten ergänzen; insbesondere keine E-Mail, Namen, Auth-Metadaten, Bank-/Adress-/Geburtsdaten oder Tokens exportieren.
4. P7.03 zuerst prüfen: exakt ein Operator, vollständige Auth-/Profil-/Rollenintegrität.
5. Alle unbekannten Tabellen aus P7.22 und alle blockierenden FKs aus P7.17 manuell klassifizieren.
6. Storage nur über aggregierte Bucket-Metadaten auswerten; Objektnamen werden erst in einem getrennten sicheren Mapping benötigt.

## Stop-Bedingungen

- Operator fehlt, ist mehrdeutig oder technisch inkonsistent.
- Rollen-/Permission-/Department-Baseline weicht vom bestätigten Systemvertrag ab.
- Eine Relation kann nicht eindeutig als Foundation, Fachdaten oder manuelle Entscheidung klassifiziert werden.
- Ein FK/Trigger könnte Foundation oder Operator beschädigen.
- Storage-Objekte können nicht sicher ihren DB-Assets zugeordnet werden.
- Für die Planung wären PII-Exporte oder mutierende Diagnosefunktionen nötig.

## Nächster sicherer Schritt

Recovery-Backup, Dry Run, Core-Ausführung und Postcheck sind erfolgreich abgeschlossen. Die 31 Core-Delete-Tabellen sind leer und die MUST-KEEP-Foundation ist intakt: 13 Rollen, 64 Permissions, 249 Rollen-Permission-Zuordnungen, 4 Departments, 2 Seasons und 25 Auditzeilen blieben erhalten; Closure Periods stehen bei 0. Genau ein Keep-Superadmin ist intakt, die fünf Nicht-Superadmin-Auth-User wurden in der getrennten Auth-Stufe entfernt. Der anschließende Public-Audit wies statisch vorgerenderte DB-Seiten als Ursache alter Inhalte nach; diese Routen laden nun request-dynamisch. Behindertensport und Gymnastikdamen unterscheiden außerdem zwischen vorhandenem Department und fehlender Section und zeigen dafür einen Empty State statt 404. Der manuelle Browserreview, die getrennte Media-/Storage-Stufe und der finale Gesamtpostcheck sind bestanden.

Direkte SQL-Maintenance umgeht die anwendungsseitigen `revalidatePath`-Aufrufe. Für weiterhin gecachte Public-Routen ist deshalb nach solcher Maintenance ein frischer Build/Redeploy oder eine definierte Pfad-Revalidation verpflichtend. Die in diesem Reparaturblock betroffenen fachlichen DB-Listen verwenden stattdessen `connection()` und lesen bei jedem Request den aktuellen Zustand.

Der abschließende Browserreview identifizierte auch `/tischtennis` als
zusätzlichen stale Prerender-Fall: Die Landingpage verwendete bereits denselben
korrekt auf Tischtennis begrenzten Team-Loader wie die leere Mannschaftsseite,
war jedoch noch mit einer 15-Minuten-Prerender-Cachefrist gebaut. Auch die
Landingpage verwendet nun `connection()`; der finale manuelle Review bestätigt
den aktuellen leeren Datenstand und den neutralen Empty State.

## Live-Baseline und verbindliche Cleanup-Matrix

Die exakten Live-Counts stammen aus den direkten Count-Resultsets, nicht aus `estimated_rows` in P7.22:

| Kategorie | Live-Count | Entscheidung |
|---|---:|---|
| Auth User / Admin Profiles | 6 / 6 | ein Superadmin behalten; fünf User später per Admin API entfernen |
| User Roles / Roles / Permissions / Matrix | 10 / 13 / 64 / 249 | Operatorbindung behalten; Foundation vollständig schützen |
| Departments | 4 | MUST KEEP |
| Teams / Team Seasons | 11 / 16 | DELETE |
| Players / Player Assignments | 22 / 25 | DELETE |
| Coaches / Coach Assignments | 8 / 15 | DELETE |
| Board Members / Club Contacts | 9 / 5 | DELETE |
| News / Events / Sponsors / Downloads | 2 / 6 / 2 / 1 | DELETE |
| Team Training / Exceptions | 7 / 0 | DELETE |
| Department Training | 2 | DELETE |
| Membership / Contributions / Payments | 13 / 5 / 8 | DELETE |
| Notifications / Deliveries / Preferences | 11 / 8 / 0 | DELETE |
| Notification Audit | 25 | MUST KEEP |
| Media Assets / Usages | 33 / 19 | separate manifestgestützte Löschstufe nach Core-Cleanup |
| Storage Objects | 109 in fünf Buckets | Buckets KEEP; Objekte zweiphasig prüfen |
| External Competitions / Year Groups | 2 / 3 | DELETE mit Team Seasons |
| Department Sections | 2 | DELETE |
| Club History Page/Milestones/Images | 1 / 14 / 0 | DELETE |
| Admin Email Change Requests | 5, davon 0 aktiv | DELETE im Core-Proposal nach Active-State-Guard |

P7.03 bestätigt genau einen aktiven Superadmin mit vorhandener Auth-, Profil- und Rollenbindung. Seine technische ID wird im Proposal ausschließlich relational ermittelt und nicht hardcodiert. P7.01 bestätigt 52 Public-Tabellen; unbekannte oder nicht ausdrücklich freigegebene Relationen bleiben vom Proposal ausgeschlossen.

## Proposal-Scope und Reihenfolge

Das Core-Proposal verwendet exakte Baseline- und Foundation-Guards und löscht ausschließlich freigegebene Tabellen in dieser Reihenfolge:

1. Notification Deliveries, Notifications, Preferences und terminale E-Mail-Wechsel-Testrequests.
2. Contribution Payments, Contributions und Membership Requests; die technische Routingtabelle `membership_request_recipients` bleibt erhalten.
3. News-/Event-Dokumente, Downloads, News, Events, Sponsors, Department-Training/-Sections sowie Club-History-Children/-Page und Pages.
4. Training Exceptions, Team Training, externe Competitions, Year Groups sowie Coach-/Player-Team-Season-Zuordnungen.
5. Team Seasons, Board Members, Club Contacts, Players, Coaches und Teams.

`club_closure_periods` würde bei Team-Season-Löschung kaskadieren. Deshalb verlangt der Guard dort exakt null Zeilen; jede Abweichung stoppt die gesamte Transaktion. Rollen, Permissions, Matrix, Departments, Settings, Lookups, Policies, RLS, Funktionen, Trigger, Constraints, Indizes und Buckets werden nicht verändert.

Für `membership_request_recipients` bedeutet MUST KEEP die Relation und ihre
Konfigurationsfähigkeit, nicht einen künstlichen Mindestbestand. Der private
Vor-Cleanup-Export und der finale Live-Postcheck bestätigen jeweils 0 Zeilen;
`0..n` ist fachlich zulässig, die Adminoberfläche unterstützt den Leerzustand
und die spätere Neuanlage. Es liegt weder Datenverlust noch Reparaturbedarf vor.

## Bewusst getrennte Ausführungsstufen

- Core SQL: alle final freigegebenen fachlichen Tabellen einschließlich Kontakte, Sections, Department-Training und Club-History/Pages.
- Auth: fünf Nicht-Superadmin-User erst danach über die bestehende serverseitige Admin API; niemals direktes SQL auf `auth.users`.
- Media/Storage: erst nach Core und finalem privatem Objektmanifest. Media Usages/Assets vor Storage Objects; Buckets bleiben.
- `notification_audit`, Seasons, Closure-Period-Nullbestand und technische Foundation bleiben erhalten.

## Auth-Cleanup-Abschluss

Der Auth-Schritt ist abgeschlossen. Der server-only Löschmechanismus verwendete
`auth.admin.deleteUser(userId)` über den nicht persistierenden Service-Role-Client;
das Dashboard selbst bietet weiterhin nur eine Deaktivierung. Der Read-only Dry
Run identifizierte den Keep-Superadmin ausschließlich relational und verlangte
fail-closed exakt einen Keep-Kandidaten sowie exakt fünf Delete Candidates.
E-Mail und UUID wurden weder hardcodiert noch ausgegeben.

Artefakte und Ablauf stehen in
[`priority7-auth-cleanup-execution-plan.md`](priority7-auth-cleanup-execution-plan.md),
[`b15-priority7-auth-cleanup-dry-run-readonly.sql`](../sql/b15-priority7-auth-cleanup-dry-run-readonly.sql)
und
[`b15-priority7-auth-cleanup-postcheck-readonly.sql`](../sql/b15-priority7-auth-cleanup-postcheck-readonly.sql).
Der spätere Delete erfolgt einzeln, nie parallel, stoppt beim ersten Fehler und
verifiziert den Keep-Vertrag nach jedem erfolgreichen Admin-API-Aufruf.

Der freigegebene Live-Lauf ist inzwischen abgeschlossen: fünf
Nicht-Superadmin-User wurden einzeln per Admin API entfernt, exakt ein
relational intakter Superadmin blieb erhalten und alle Foundation-Counts sind
unverändert. Der vorhandene Profil-Delete-Trigger entfernte acht zu den
gelöschten Profilen gehörende Avatar-Usages; alle 33 Media Assets blieben
erhalten. Die anschließend separat freigegebene Media-/Storage-Stufe ist
ebenfalls abgeschlossen.

Für `club_closure_periods` ist ein direkter Count von null bestätigt; jede
spätere Abweichung stoppt das Proposal. Alle zuvor offenen fachlichen Klassen
sind final entschieden. Es verbleibt keine fachliche Manual Decision, sondern
nur das Backup-/Recovery- und ausdrückliche Ausführungsgate.

Der datensparsame Decision-Preflight und das Storage-Manifest dokumentieren
die Entscheidungsgrundlage. Sie sind keine Voraussetzung für eine erneute
fachliche Entscheidung; die Betreiberentscheidungen sind final. Konkrete
Storage-Objektpfade müssen dennoch vor der getrennten Storage-Stufe privat
freigegeben werden.

## Auth-, Storage- und Recovery-Strategie

Recovery verwendet **Variante B – private Exporte**, weil ein tatsächlich
nutzbarer projektspezifischer Supabase-Backup-/PITR-Punkt aus Repository und
lokalem Workflow nicht belastbar nachgewiesen werden kann. Ziel ist
`.local/priority7-backup/`; `/.local/` ist repositoryseitig ignoriert. Der
private Export und der siebenstufige Dry Run
[`b15-priority7-database-cleanup-dry-run-readonly.sql`](../sql/b15-priority7-database-cleanup-dry-run-readonly.sql)
wurden vor dem Core-Cleanup erfolgreich als Ausführungsgate bestätigt. Private
Exporte und Manifestdaten bleiben unveröffentlicht und unversioniert.

Das Proposal führt kein direktes `DELETE` auf `auth.users` aus. Nach erfolgreichem, separat freigegebenem Core-Cleanup werden die fünf Nicht-Superadmin-User einzeln über den bestehenden serverseitigen Supabase-Admin-API-Vertrag entfernt; Auth-interne Relationen, `admin_profiles` und `admin_user_roles` folgen ihren bestätigten Cascades. Danach muss der Postcheck exakt einen Auth User, ein Profil und eine intakte Superadminbindung bestätigen.

Storage bleibt zweiphasig: Das Read-only-Manifest ordnet DB-Assets und Storage-Pfade zu und weist DB-/Storage-Orphans aggregiert beziehungsweise technisch aus. Erst nach Betreiberfreigabe darf ein separater Storage-API-Lauf konkrete Objekte entfernen. Kein Bucket wird gelöscht. Recovery erfolgt nur über vorher verifiziertes Backup/PITR oder vollständige private Exporte gemäß [`priority7-database-cleanup-recovery-plan.md`](priority7-database-cleanup-recovery-plan.md).
