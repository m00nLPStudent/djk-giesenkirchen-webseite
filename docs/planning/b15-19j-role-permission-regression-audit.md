# B15.19J – Rollen- und Berechtigungs-Regression

## Grundlage

Repositoryquellen: `admin-auth-seed.sql`, `adminActionPermissions.js`, `permissionEngine.js`, `adminPermissionConfig.js`, Navigation sowie alle B15.19-Domain-Actions. `assertAdminActionPermission` lädt die Session mit `auth.getUser()`, verlangt ein aktives Adminprofil, lädt Rollen und Permissions und prüft über `hasPermission`. Superadmin besitzt dort den dokumentierten Permission-Bypass. Der Admin-Client wird in den geprüften Media-Mutationspfaden erst nach dieser Prüfung verwendet.

Tatsächliche Rollen: `superadmin`, `vorstand`, `fussball-vorstand`, `jugendleiter`, `trainer`, `betreuer`, `redakteur`, `kassierer`, `webmaster`, `gast`.

## Relevante Rollen-Permission-Matrix

Legende: V=View, C=Create, E=Edit, D=Delete, P=Publish; `–`=keine relevante Permission.

| Rolle | News | Events | Teams | Players | Coaches | Sponsors | Chronik | Settings | System |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| superadmin | VCEDP | VCEDP | VCED | VCED | VCED | VCED | VEP | VE | V |
| vorstand | VCEP | VCEP | VCE | VCE | VCE | VCE | VEP | V | – |
| fussball-vorstand | VCEP | VCEP | VCE | VCE | VCE | VE | VE | – | – |
| jugendleiter | VCE | VCE | VE | VCE | VCE | – | – | – | – |
| trainer | – | VCE | VE | VE | – | – | – | – | – |
| betreuer | – | V | V | VE | – | – | – | – | – |
| redakteur | VCEP | VCEP | – | – | – | V | VEP | – | – |
| kassierer | – | – | – | – | – | – | – | VE | – |
| webmaster | VE | VE | V | V | V | V | V | VE | V |
| gast | V | V | – | – | – | – | V | – | – |

Die zentrale Medienbibliothek verwendet bewusst keinen allgemeinen Media-Permission-Key: Route, Navigation, Seite und Actions begrenzen auf Rollen `superadmin`/`webmaster`; beide besitzen außerdem `system.view`.

## B15.19-Autorisierungsmatrix

| Bereich / Operation | Serverpfad | Prüfung | Nicht-Superadmin laut Seed | Sichtbarkeit | Ergebnis |
| --- | --- | --- | --- | --- | --- |
| Spieler Create/Edit/Bild/Usage | `players/actions.js` | `players.create/edit` + Person-/Teamscope | Vorstand, Fußball-Vorstand, Jugendleiter; Edit zusätzlich Trainer/Betreuer | public; admin nur Superadmin/Webmaster | sicher |
| Trainer Create/Edit/Bild/Usage | `coaches/actions.js` | `coaches.create/edit` + Teamscope | Vorstand, Fußball-Vorstand, Jugendleiter | public; admin nur Superadmin/Webmaster | sicher |
| Vorstand Create | `department/board/actions.js` | `settings.edit` + Boardscope | Kassierer, Webmaster | public; admin nur Superadmin/Webmaster | sicher gemäß Seed |
| Vorstand Edit/Bild/Picker | gleicher Pfad | `settings.edit` + Boardscope | Kassierer, Webmaster | public; admin nur Superadmin/Webmaster | mit B15.19J1 gehärtet |
| Vereinskontakt CRUD/Bild | `settings/contacts/actions.js` | `settings.edit` | Kassierer, Webmaster | public; admin nur Superadmin/Webmaster | sicher gemäß Seed |
| Teams und Saison-/Kontaktbilder | `teams/actions.js` | `teams.create/edit` + Teamscope | Vorstand, Fußball-Vorstand, Jugendleiter, Trainer (Edit) | public; admin nur Superadmin/Webmaster | sicher |
| News Create/Edit/Titelbild/Dokumente | `news/actions.js` | `news.create/edit` | Vorstand, Fußball-Vorstand, Jugendleiter, Redakteur; Webmaster Edit | public; admin nur Superadmin/Webmaster; Inline immer public | mutationssicher |
| News Publish-Feld im Save | gleicher Pfad | `news.create/edit` + bei Status-/Terminänderung `news.publish` | Publish: Vorstand, Fußball-Vorstand, Redakteur | wie oben | mit B15.19J2 gehärtet |
| Event Create/Edit/Titelbild/Dokumente | `events/actions.js` | `events.create/edit` | Vorstand, Fußball-Vorstand, Jugendleiter, Trainer, Redakteur; Webmaster Edit | public; admin nur Superadmin/Webmaster | mutationssicher |
| Event Publish-Feld im Save | gleicher Pfad | `events.create/edit` + bei Statusänderung `events.publish` | Publish: Vorstand, Fußball-Vorstand, Redakteur | wie oben | mit B15.19J2 gehärtet |
| Sponsoren Create/Edit/Logo | `sponsors/actions.js` | `sponsors.create/edit` | Vorstand; Fußball-Vorstand Edit | public; admin nur Superadmin/Webmaster | sicher |
| Chronik Seite/Meilensteine/Bilder | `club-history/actions.js` | `club_history.edit` | Vorstand, Fußball-Vorstand, Redakteur | public; admin nur Superadmin/Webmaster | mutationssicher |
| Chronik Publish-Feld im Save | gleicher Pfad | `club_history.edit` + bei Status-/Terminänderung `club_history.publish` | Publish: Vorstand, Redakteur | wie oben | mit B15.19J2 gehärtet |
| Medienbibliothek Upload/Archiv | `media/actions.js` | Session + Superadmin/Webmaster-Rolle | Webmaster | public/admin/restricted gemäß gewähltem Asset | beabsichtigt rollenbegrenzt |

Delete-Pfade prüfen jeweils die vorhandene `*.delete`-Permission; zentrale Assets werden beim Lösen fachlicher Zuordnungen nicht gelöscht. Gehärtete Tabellen werden von den geprüften Client Components nicht direkt beschrieben.

## Visibility

- Fachpicker: berechtigter Bearbeiter sieht/selektiert `public`.
- Zusätzlich `admin` nur, wenn `canManageMedia` eine Rolle `superadmin` oder `webmaster` findet.
- `restricted` wird von keinem geprüften Fachpicker angeboten.
- Direkte Fachuploads sind `public`.
- News-Inline-Medien sind ausdrücklich public-only.
- Die eigenständige Medienbibliothek kann als Superadmin/Webmaster alle Visibility-Klassen verwalten.

## Befunde

### ERLEDIGT IN B15.19J1 – Board-Edit/Media prüfte View statt Edit

- Erwartung aus Route und UI: `settings.edit`.
- Vor J1 verlangten `saveBoardMemberWithScopeAction` und `authorizeBoardMedia` bei bestehender ID nur `settings.view`.
- Seit J1 verlangen Save, Board-Media-Picker und Board-Media-Upload serverseitig `settings.edit`; der bestehende Board-Scope bleibt zusätzlich aktiv.

### ERLEDIGT IN B15.19J2 – Publish-Permissions wurden in Save-Actions nicht getrennt erzwungen

- Vorhandene Keys: `news.publish`, `events.publish`, `club_history.publish`.
- Vor J2 akzeptierten Save-Actions Publishstatus mit Create/Edit. Rollen mit Edit aber ohne Publish konnten dadurch publizieren oder die Veröffentlichung zurücknehmen.
- Seit J2 wird der alte Zustand serverseitig geladen und bei Publish, Unpublish oder einer öffentlich wirksamen `published_at`-Änderung zusätzlich die jeweilige bestehende Publish-Permission geprüft.

### MITTEL – globale Routenprüfung ist konfigurationsseitig deaktiviert

- `AUTH_ENFORCEMENT_ENABLED=false` macht UI-/Route-Helper weich. Die geprüften Server-Actions autorisieren dennoch hart und sind deshalb nicht unmittelbar offen.
- Dies ist kein B15.19-Fixgegenstand, erhöht aber die Bedeutung vollständiger Action-Prüfungen.

Keine KRITISCHEN service-role-ohne-Session-Pfade und keine unbeabsichtigten Superadmin-only-Fachmutationen wurden gefunden.
