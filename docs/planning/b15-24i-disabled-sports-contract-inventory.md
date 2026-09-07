# B15.24I – Behindertensport: Contract Inventory

Status: **COMPLETE – DASHBOARD, PUBLIC SECTION, SECURITY CORRECTIONS AND HOMEPAGE TRAINING MANUALLY VERIFIED**

## Betreibervorgabe

Behindertensport erhält einen eigenen, schlanken Dashboardbereich und genau eine öffentliche Route `/behindertensport`. Pflegbar werden Gruppenbild, deutscher Seitentitel und Beschreibungstext, ein expliziter Ansprechpartner, abteilungsweite Trainingszeiten samt Ort/Adresse sowie Aktiv-/Public-Status. Bearbeiten dürfen ausschließlich Superadmin und Gesamtvereinsvorstand. Es entsteht keine neue Behindertensportrolle und kein Team-, Saison-, Kader-, Trainer-, Board- oder Spielbetriebsmodul.

Gymnastikdamen soll später denselben neutralen technischen Grundvertrag mit strikt getrennten Datensätzen nutzen. B15.24I implementiert Gymnastikdamen noch nicht.

## Repository-As-built

- `/behindertensport` existiert als statischer, responsiver Aufbauzustand auf der gemeinsamen Public-Designbasis. Desktop- und Mobilnavigation sowie Footer verlinken direkt dorthin; der Active-State-Vertrag ist bereits generisch korrekt.
- Im Admin-Navigationsmodell existiert Behindertensport nur als `planned`-Gruppe ohne Route, Permission oder aktive Einträge. Es gibt keine Adminroute und keine Server Actions dafür.
- `pages` kann deutschen Titel, Richtext und Publish-Status tragen, besitzt nach dem Repositoryvertrag aber keine Department-Zuordnung und keine Gruppenbildreferenz.
- `club_contacts` trägt expliziten Namen, öffentliche E-Mail/Telefon, Aktiv-/Public-Status und ein zentrales Kontaktbild. Die Zuordnung erfolgt aktuell über eine freie Kategorie; eine nachgewiesene FK-gebundene Department-Zuordnung fehlt.
- Die zentrale Medienbibliothek kann ausschließlich aktive Public-Bilder öffentlich auflösen. Der bestehende Synchronisations-RPC kennt jedoch nur seine aktuelle Entity-Allowlist; ein neuer neutraler Section-Entity-Vertrag ist nicht nachgewiesen.
- `team_training_times` ist zwingend an `team_season_id` gebunden. Der Homepage-Loader folgt `team_training_times -> team_seasons -> teams -> departments`, erzeugt virtuelle Trainingstermine, wendet Ausnahmen und Vereinsschließzeiten an, sortiert global und begrenzt danach auf fünf. Behindertensport ohne Mannschaft kann diesen Vertrag nicht fachlich korrekt verwenden.
- Der Sport-/Iconresolver kennt `behindertensport -> inclusive-sports` bereits. Der Darstellungsvertrag kann deshalb wiederverwendet werden, sobald ein neutraler Trainingseintrag dasselbe sichere Public-DTO liefert.

## Architekturentscheidung nach Repositoryanalyse

Ein Dummy-Team ist ausdrücklich ausgeschlossen. Eine neue Fachrolle ist nicht erforderlich. Eine Wiederverwendung der generischen UI-Primitives, Media-Picker-Bausteine, Wochentags-/Zeitfelder, Public Cards und Training-Occurrence-Helfer ist sinnvoll; die fachlichen Daten- und Autorisierungsgrenzen bleiben serverseitig.

Der vollständige Live-Preflight bestätigt, dass keine persistente neutrale Section-Struktur und kein abteilungsweiter Trainingsvertrag vorhanden sind. Der kleinste gemeinsame Zielvertrag ist deshalb:

1. eine neutrale, je Department eindeutige Section-Entität für deutschen Titel/Text, Public-/Aktivstatus, Gruppenbild und expliziten Kontaktbezug;
2. eine neutrale abteilungsweite Trainingstabelle mit Department-/Section-FK, Wochentag, Beginn/Ende, Ort/Halle, Straße, Ort, optionalem Hinweis/Gültigkeitszeitraum und Aktivstatus;
3. zentrale Media-Usage-Unterstützung für das Gruppenbild;
4. eigene schmale View-/Edit-Permissions, initial nur für `superadmin` und `vorstand`, statt Wiederverwendung des breiteren `settings.edit`-Vertrags;
5. server-only Mutationen und ein fail-closed Public-Loader ohne unnötige IDs oder interne Felder.

Der verifizierte Minimalumfang umfasst zwei neue neutrale Tabellen sowie die kontrollierte Erweiterung des bestehenden Media-Usage-Vertrags. Noch kein DB-Proposal und keine Produktimplementierung.

## Zieloberflächen

Dashboard: ein eigener Hauptreiter Behindertensport mit einer kompakten Editorseite. Sinnvolle Abschnitte sind Allgemein, Ansprechpartner, Trainingszeiten und Medien; keine unnötigen Unterseiten.

Public: Hero mit Public-Gruppenbild oder Placeholder, Titel und Einleitung, danach responsive Ansprechpartner-/Trainingszeiten-Spalten und optional längerer Text. Ohne explizit freigegebenen Kontakt erscheint ein neutraler Leerzustand; es gibt keinen Board-, Trainer- oder sonstigen Kontaktfallback.

Homepage: aktive abteilungsweite Trainingszeiten werden in denselben normalisierten Occurrence-Strom aufgenommen und erst danach gemeinsam mit Football-/TT-Terminen chronologisch sortiert und auf die globalen Top 5 begrenzt. Keine doppelte Pflege.

## Verifizierter Live-Preflight

Alle 18 Resultsets aus [`../sql/b15-24i-disabled-sports-live-preflight-readonly.sql`](../sql/b15-24i-disabled-sports-live-preflight-readonly.sql) wurden vollständig und eindeutig ausgewertet. Die lokalen CSV-Exporte bleiben unter `.local` und werden nicht versioniert.

- Behindertensport ist noch kein Department. Gymnastikdamen existiert eindeutig mit dem aktiven Slug `damen-gymnastik`.
- `department_sections`, `department_training_times`, `activity_sections` und `activity_training_times` existieren nicht. Es gibt weder eine bestehende neutrale Section- noch eine departmentweite Trainingstabelle.
- `pages` besitzt nur Slug, deutschen/englischen Titel und Inhalt, Publish-/Footerstatus und Sortierung. Es gibt keine Department-, Kontakt- oder Media-FK. Für Behindertensport und Gymnastik bestehen null passende Seiten. Zudem ist RLS auf `pages` live deaktiviert und anon/authenticated besitzen breite effektive Rechte; diese Legacy-Tabelle ist deshalb keine geeignete neue Sicherheitsgrenze für I.
- `club_contacts` besitzt Public-/Aktivstatus und eine Media-FK, aber keine Department-FK. Es existieren null Behindertensport- und null Gymnastikkandidaten. Der allgemeine Mutationsvertrag folgt `settings.edit`; dadurch könnten Kassierer und Webmaster Kontakte bearbeiten. Eine dort gespeicherte Section-Zuständigkeit wäre daher nicht auf Superadmin und Gesamtvereinsvorstand begrenzt.
- `media_assets` und `media_asset_usages` sind vorhanden und RLS-geschützt. Es existieren aktive Public-Bilder. Der Entity-Constraint und `synchronize_media_assignment` kennen jedoch keinen Section-Typ; der Gruppenbildvertrag muss kontrolliert erweitert werden.
- Alle 7 vorhandenen `team_training_times` haben eine nicht-null `team_season_id`; null teamunabhängige, Behindertensport- oder Gymnastiktrainings sind vorhanden. FK und Policies folgen zwingend `team_training_times -> team_seasons -> teams`. Ein departmentweiter Weg ohne Mannschaft existiert nicht.
- Nur `settings.view` und `settings.edit` existieren als relevante Permissions. `settings.edit` ist Superadmin, Kassierer und Webmaster zugeordnet, dem Gesamtvereinsvorstand aber nicht. Neue schmale Section-Permissions sind deshalb erforderlich. Die bereits bestehende Membership-Rolle `behindertensport-vorstand` wird nicht als Contentrolle verwendet und erhält keine neue Freigabe.

## Minimaler DB-Zielvertrag

Der Livezustand bestätigt **DB CHANGE REQUIRED**. Das spätere Proposal soll ausschließlich folgenden neutralen Vertrag vorbereiten:

1. Den fehlenden aktiven Department-Stammdatensatz `behindertensport` defensiv anlegen. Den bestehenden Datensatz `damen-gymnastik` weder duplizieren noch fachlich verändern.
2. `department_sections`: eine Zeile je Department (`UNIQUE department_id`) mit `title_de`, `description_de`, optionaler Public-Gruppenbild-FK, direkt sectiongebundenen expliziten Kontaktfeldern (`contact_name`, optional `contact_email`, `contact_phone`, `contact_is_public`) sowie `is_active`, `is_published` und Zeitstempeln. Direkte Kontaktfelder vermeiden den fachlich zu breiten allgemeinen `club_contacts`-Editor. Department-FK `ON DELETE RESTRICT`, Media-FK `ON DELETE SET NULL`; kein automatischer Backfill.
3. `department_training_times`: Department-FK, Wochentag, Beginn/Ende, optional Trainingsort, Adresse, Ort, Hinweis, Gültig-ab/-bis, Aktivstatus, Sortierung und Zeitstempel. Department-FK `ON DELETE RESTRICT`; Zeit-/Wochentag-/Gültigkeitschecks und ein fachlich eindeutiger Slot-Index analog zum bestehenden Trainingsvertrag. Keine Mannschaft und keine Saison.
4. `department_sections.view` und `department_sections.edit` neu anlegen und ausschließlich `superadmin` sowie `vorstand` zuweisen. Kassierer, Webmaster, Department-Vorstände, Trainer und Betreuer bleiben ohne diese Rechte.
5. Beide Tabellen mit RLS aktivieren. Public SELECT liefert nur aktive/veröffentlichte Sections beziehungsweise aktive Zeiten eines aktiven Departments mit aktiver/veröffentlichter Section. Browsermutationen für anon/authenticated bleiben entzogen; Service-Role-Writes erfolgen erst nach serverseitiger Permissionprüfung.
6. Den zentralen Media-Assignment-Vertrag minimal um `department_section/image` sowie Cleanup erweitern. Nur aktive Public-Bilder sind für die öffentliche Ausgabe zulässig.

Der Homepage-Aggregator soll später Team- und Departmenttrainings getrennt laden, in dasselbe sichere Occurrence-DTO normalisieren, Vereinsschließzeiten anwenden, beide Ströme zusammenführen und erst danach chronologisch auf die globalen Top 5 begrenzen. Departmenttrainings verwenden einen kollisionsfreien Occurrence-Identifier, `department_slug` und den bereits vorhandenen `inclusive-sports`-/`gymnastics`-Iconvertrag. Team-Ausnahmen bleiben unverändert; für I ist keine neue Ausnahme-Tabelle gefordert.

## Gate

Die drei I.3-Artefakte wurden vorbereitet; das Proposal wurde anschließend vom Betreiber manuell ausgeführt und mit 15/15 Postcheck-Resultsets geprüft:

- [`../sql/b15-24i-department-sections-db-change-proposal.sql`](../sql/b15-24i-department-sections-db-change-proposal.sql)
- [`../sql/b15-24i-department-sections-db-change-rollback.sql`](../sql/b15-24i-department-sections-db-change-rollback.sql)
- [`../sql/b15-24i-department-sections-db-change-postcheck-readonly.sql`](../sql/b15-24i-department-sections-db-change-postcheck-readonly.sql)

Das Proposal hat den fehlenden Department-Stammdatensatz defensiv angelegt, keine Section-, Kontakt-, Medien- oder Trainingsinhalte erzeugt und `damen-gymnastik` nicht verändert. Der Rollback bleibt ausschließlich als vorbereitetes, nicht ausgeführtes Artefakt erhalten. Der Postcheck bestätigte die Grundmigration und deckte zugleich die nachfolgend dokumentierte Public-Read-Sicherheitslücke auf.

## I.3C – Security-Correction nach Live-Postcheck

Die I.3-Migration wurde manuell ausgeführt und mit 15/15 Resultsets grundsätzlich bestätigt. Dabei wurde die Public-Policy für `department_training_times` als unkorreliert erkannt: Das unqualifizierte `department_id` bindet innerhalb der `EXISTS`-Unterabfrage an `department_sections.department_id`, nicht an die äußere Trainingszeile. Eine veröffentlichte fremde Section könnte dadurch Trainingszeilen eines anderen Departments freigeben.

Die Rohspalten `contact_name`, `contact_email` und `contact_phone` sind für anon/authenticated korrekt nicht lesbar. Dadurch fehlt jedoch noch ein sicherer öffentlicher Vertrag für ausdrücklich freigegebene Section-Kontakte. I.3C bereitet deshalb ausschließlich vor:

- eine explizit mit `department_training_times.department_id` korrelierte Public-Training-Policy;
- `get_public_department_section(text)` als schmale, parameterisierte und sanitisiert maskierende Public-Read-Funktion;
- Kontaktwerte nur bei `contact_is_public = true`, sonst zwingend `NULL`;
- unveränderte Rohspaltensperre, RLS, Permissions, Rollenmatrix, Media-Verträge und Daten.

Die Security-Correction, ihr isolierter Rollback und der neun Resultsets umfassende Read-only-Postcheck wurden zunächst vorbereitet. Der Betreiber hat die I.3C-Korrektur anschließend manuell ausgeführt und alle 9/9 Resultsets erfolgreich verifiziert. Die Training-Policy ist nun strikt mit der jeweiligen äußeren Department-Trainingszeile korreliert; private Contact-Rohspalten bleiben gesperrt und der sanitisiert maskierende Public-Read-Vertrag ist live bestätigt. Der Rollback wurde nicht ausgeführt.

## I.4 – Dashboard-Section-Editor

Der Dashboard-Editor ist unter `/admin/behindertensport` implementiert. Navigation und Route verlangen `department_sections.view`; sämtliche Mutationen verlangen serverseitig `department_sections.edit`. Das Zieldepartment wird in Loader und Actions ausschließlich über den festen aktiven Slug `behindertensport` aufgelöst. Clientseitige Department-IDs werden weder akzeptiert noch vertraut.

Der kompakte responsive Editor unterstützt den bewussten Create-/Update-Vertrag der eindeutigen Section, deutschen Titel und Beschreibung, getrennten Aktiv-/Publishstatus, explizite Kontaktdaten samt Privacy-Schalter, Public-Gruppenbild über `department_section/image` sowie mehrere team- und saisonunabhängige Trainingszeiten. Training Update, Toggle und Delete laden vor dem Write den Datensatz und verweigern fremde Departmentzuordnungen. Der leere Initialzustand erzeugt keine Daten; der UI-Titel wird erst durch eine bewusste Speicherung persistiert.

Der vollständige manuelle I.4-Dashboard-Browserreview ist bestanden: Section Create/Update, Inhalt, Aktiv-/Publishstatus, Media Add/Replace/Remove, Privacy-Kontakt, mehrere Trainingszeiten samt Create/Edit/Toggle/Delete, Persistenz, Rollen-DENY und responsive Darstellung wurden bestätigt.

## I.5 – Öffentliche Website

`/behindertensport` verwendet nun den neutralen server-only Public-Section-Vertrag. Aktive und veröffentlichte Section-Daten einschließlich maskiertem Kontakt werden ausschließlich über `get_public_department_section(text)` geladen; fehlt der freigegebene Vertrag, reagiert die Route fail-closed mit 404. Trainingszeiten werden per korrigierter Public-RLS gelesen und zusätzlich im DTO auf Department, Aktivstatus sowie aktuellen Gültigkeitszeitraum begrenzt. Das Gruppenbild wird ausschließlich über den zentralen Public-Media-Resolver ausgegeben; andernfalls erscheint das bestehende Behindertensport-Sporticon als robuster Placeholder.

Das gemeinsame responsive Section-Layout zeigt in semantischer DOM-Reihenfolge Titel, Ansprechpartner/Trainingszeiten, Gruppenbild und anschließend den vorhandenen Beschreibungstext als eigenständigen Bereich „Über uns“. Ansprechpartner und Trainingszeiten stehen ab Tablet zweispaltig in gleich breiten, gestreckten Karten und mobil untereinander. Eine leere Beschreibung blendet den Inhaltsbereich aus. Private Kontaktdaten, interne IDs und Auditfelder gelangen nicht ins DTO; es existiert weiterhin kein Kontaktfallback.

Der erste manuelle I.5-Browserreview ist fehlgeschlagen: Trotz aktiver und veröffentlichter Section sowie aktiver Dienstags-Trainingszeit liefert `/behindertensport` 404. Die read-only Live-Diagnose bestätigt Section-RPC und aktives Department, während der normale Anon-SELECT auf `department_training_times` mit `42501 permission denied for table media_assets` scheitert. Ursache ist die transitive RLS-Auswertung `department_training_times_public_read -> department_sections -> department_sections_public_read -> media_assets`. Der Repositoryfehler führt anschließend kontrolliert zu `notFound()`. Ein Service-Role-Bypass oder das Verschlucken des Trainingfehlers ist kein zulässiger Fix. Der zehn Resultsets umfassende I.5F2-Preflight [`../sql/b15-24i-public-training-media-rls-preflight-readonly.sql`](../sql/b15-24i-public-training-media-rls-preflight-readonly.sql) wurde ausschließlich read-only vorbereitet; zu diesem historischen Zwischenstand war I.6 noch nicht gestartet.

I.5F3 ist **SECURITY CORRECTION PASSED**. Nach der erfolgreich manuell ausgeführten Entkopplung und dem bestandenen Security-Postcheck lädt `/behindertensport` die freigegebenen Section-, Kontakt-, Trainings- und Bilddaten wieder korrekt. I.5F4 und der vollständige I.5-Browserreview sind **MANUAL PUBLIC REVIEW PASSED**.

I.6 ist **IMPLEMENTED / AWAITING MANUAL HOMEPAGE REVIEW**: Ein neutraler server-only Loader liest veröffentlichte Department-Trainingszeiten über die bestehende Public-RLS, ohne Kontakt- oder Media-Abhängigkeit. Er verlangt aktives Department, aktive und veröffentlichte Section sowie aktive und im Gültigkeitszeitraum liegende Trainingsdaten. Daraus entstehen konkrete `department_training`-Occurrences im bestehenden Eventformat. Sie werden zusammen mit Team-Occurrences global chronologisch sortiert und erst danach durch das unveränderte Homepage-Limit fünf begrenzt. Globale Vereinsschließzeiten gelten für beide Quellen; ein eigenes Department-Ausnahmemodell existiert weiterhin nicht. Behindertensport verwendet den freigegebenen Section-Titel mit Departmentnamen als Fallback und das vorhandene Adaptive-Sports-Icon. Gymnastikdamen ist nicht implementiert, kann aber später denselben neutralen Vertrag nutzen.

Der Betreiber hat alle 10/10 I.5F2-Resultsets ausgeführt und den erwarteten Livevertrag bestätigt. Die defensive I.5F3-Korrektur wurde anschließend manuell ausgeführt und mit dem neun Resultsets umfassenden Read-only-Postcheck sowie dem Public-Browser-Retry erfolgreich verifiziert. Sie entfernt ausschließlich die unnötige Media-Abhängigkeit aus `department_sections_public_read` und dem sanitisierten Section-RPC. Section-Publication bleibt an aktives Department sowie aktive/veröffentlichte Section gebunden; die Kontaktmaskierung bleibt erhalten. Die korrigierte Training-Policy, RLS, Tabellenrechte und der absichtlich fehlende Anon-SELECT auf `media_assets` bleiben unverändert. Kein Rollback wurde ausgeführt.

## Abschluss und Wiederverwendung

I.1 Contract Inventory und Live-Preflight, I.2/I.3 DB-Foundation und Security Contract, I.4 Dashboard, I.5 Public Website einschließlich I.5F3/F4 sowie I.6 Homepage-Training sind vollständig abgeschlossen. Die DB-Foundation und beide Security-Korrekturen wurden innerhalb des Gesamtblocks manuell angewendet und read-only nachgeprüft; spätere Produktphasen führten keine weiteren DB-Änderungen aus.

Der nächste Fachblock ist B15.24J Gymnastikdamen mit dem bestehenden Department-Slug `damen-gymnastik`. Wiederverwendet werden `department_sections`, `department_training_times`, gemeinsamer Section-Editor, Public-Loader, Public-Layout, Homepage-Department-Loader und Occurrence-Merge. Geplant sind ein eigener Dashboard-Reiter, getrennte Section-Daten, Gruppenbild, Beschreibung, expliziter Ansprechpartner, Trainingszeiten/-ort, eine eigene öffentliche Seite und Homepage-Integration. Der Berechtigungsvertrag bleibt Superadmin und Gesamtvereinsvorstand EDIT; andere Rollen DENY. B15.24J ist noch nicht implementiert.
