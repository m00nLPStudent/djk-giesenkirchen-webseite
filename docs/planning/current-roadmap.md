# Aktuelle Roadmap

Stand: **29. September 2026 · Version 1.0.13 abgeschlossen**

Dieses Dokument ist die verbindliche Quelle für offene, teilweise erledigte, Go-live- und optionale Arbeiten. Historische B12–B15-Planungs- und SQL-Dateien bleiben Nachweise, bilden aber keine parallele To-do-Liste.

## Erledigt

- **B15.18/B15.19:** Notification-Grundsystem, Audit, Idempotenz, zentrale Medienbibliothek, Fachintegrationen sowie die zugehörigen Security-Nachläufe. Die operative Contribution-Reminder-Aktivierung bleibt separat unter Go-live offen.
- **B15.21A–C:** gehärteter Membership-Submit, Geburtsdatum/Jahrgang, saisonale Mannschaftsfilterung und -auswahl, Anfragearten, Zuständigkeiten, Sichtbarkeit, Bearbeitung und Weiterleitung.
- **B15.21D3–D11:** reale Membership-Eingangsbestätigung, zentrale Notification-Mail-Delivery, globale Superadmin-Mailsteuerung, persönliche In-App-Präferenzen sowie Notification-Center mit Einzel-/Mehrfachauswahl, „Alle sichtbaren auswählen“ und Sammellöschen.
- **B15.22A–E:** Download-Admin-CRUD, zentrale Medienbibliothek, kontrollierter öffentlicher Dateiabruf und Footerintegration.
- **B15.23A–E:** bestehendes Personen-/Profilmodell, Security-Hardening, Dashboardprofil, Recovery, Einladung und bestätigter Admin-E-Mail-Wechsel einschließlich Auth/Profile-Synchronisierung und Guard.
- **Rollen und Security:** zentrales Permission-System, Gesamtvereins- und Department-Scopes, Football-/Tischtennis-Department-Manager, Board-Scope `club | department | unassigned`, server-only Mutationen und die verifizierten RLS-/Grant-/Policy-Härtungen.
- **B15.24A–N:** öffentliche Designbasis, Navigation, Header/Footer, Fußball, Tischtennis, Behindertensport, Gymnastikdamen, Vorstand, Trainingsrouting, Accessibility/Performance/SEO, Consent sowie zentrales E-Mail-Layout. Details bleiben in den jeweiligen As-built-Dokumenten.
- **Priority 7:** kontrollierte Core-, Auth-, Media- und Storage-Testdatenbereinigung samt finalem Read-only-Gesamtpostcheck.
- **Preproduction-Betrieb:** Hetzner-Webhosting unter `djkvfl-test.de`, produktionsnaher Node-Betrieb, GitHub-Actions-Deployment, isolierter Lockfile-Build und manueller Node-Neustart in konsoleH als etablierter Betriebsablauf.
- **Go-live-Vorbereitung 1–3:** All-Inkl-/DNS-Bestand und Hetzner-Zielbetrieb für die endgültige Domain sind analysiert. Der zentrale produktive Mailaufbau für Anwendungs-/Notification-Mails und Supabase Auth verwendet die verifizierte Versanddomain `mail.djkvfl-giesenkirchen.de` und wurde mit realen Zustellungen erfolgreich getestet. Eine DNS-Umschaltung der Hauptdomain hat noch nicht stattgefunden.
- **B15.25 / Go-live-Punkt 4:** Support Tickets V1 einschließlich DB-/Security-Unterbau, atomarer RPCs, Dashboard-Oberfläche, Rollen- und Ownership-Vertrag, Notifications, kontrolliert aktivierter Ticket-Mails und erfolgreicher Live-Abnahme mit Trainer und Superadmin ist abgeschlossen.

### Abgeschlossene Releases

- **1.0.4:** Fußball-Juniorenjahrgänge, Tischtennis-Multi-Team-Zuordnung und der dokumentierte Wartungslauf für doppelte TT-Player-Master.
- **1.0.5:** sicheres, permissiongeschütztes Löschen bestehender Termine.
- **1.0.6:** öffentliche Ausblendung von `Keine Lizenz`, Board Responsibilities, Dashboard-Aufgabenverwaltung und öffentlicher Responsibilities-Dialog.
- **1.0.7:** vertikale öffentliche Trainer- und Vorstandskarten, einheitliche responsive Gridbreiten, harmonisierte Kontaktfooter und erfolgreicher Live-Review.
- **1.0.8:** öffentliche Telefon- und E-Mail-Aktionen auf den Gesamtvorstandskarten.
- **1.0.9:** permission- und departmentgeschützte Ergebnisverwaltung für Fußball und Tischtennis sowie öffentlicher, routenabhängiger Ergebnisticker; deployed und live geprüft.
- **1.0.10:** serverseitig begrenzte Mannschaftsbearbeitung für Trainer; deployed und im Rollen-Livetest geprüft.
- **1.0.11:** gehärteter Jugendleiter-Vertrag und getrennte Team-Season-Update-/Create-Rechte; deployed und live geprüft.
- **1.0.12:** Tischtennis-Scope für News/Termine und präzisierter Kassierer-Vertrag; deployed und live geprüft.
- **1.0.13:** B15.25 Support Tickets V1 ist implementiert, deployed und nach dem Permission-Guard-Hotfix live abgenommen. Ticket-Erstellung, Antworten, Status, Priorität, Zuweisung, Abschluss/Wiederöffnung, Dashboard-Benachrichtigungen und alle drei aktivierten Ticket-Mailtypen wurden erfolgreich geprüft.

## In Arbeit / teilweise erledigt

### Echtdaten / Content-Befüllung

Die technische Plattform ist produktionsfähig und die kontrollierte Testdatenbereinigung ist abgeschlossen. `djkvfl-test.de` enthält die für den Cutover freigegebene Original-Webseite mit echten Vereins-/Produktivdaten. Der noch unvollständige Behindertensport-Content sowie kleinere redaktionelle Inhalts- und Rollendetails werden nachgeführt und sind keine Go-live-Blocker.

### Legal und Provider

Impressum, Datenschutz, AGB, CMS-/Renderingintegration und Consent-Manager sind technisch umgesetzt, erreichbar und manuell geprüft. Verbleibende redaktionelle oder juristische Feinprüfungen werden getrennt nachgeführt und sind nach aktueller Betreiberbewertung keine Cutover-Blocker.

## Offen vor Go-live

### Finale Domain und Environment

- finale Vereinsdomain und finaler Domain-/SSL-Zustand
- finale Environment-URLs einschließlich `NEXT_PUBLIC_SITE_URL`
- Supabase Site URL und Redirect-Allowlist
- produktive Suchmaschinenindexierung erst mit gültiger HTTPS-Domain und `PUBLIC_SITE_INDEXING_ENABLED=true`
- `robots.txt` und Sitemap auf der finalen Domain erneut prüfen

### E-Mail und Auth

Der produktive Mailaufbau ist festgelegt und live getestet. Anwendungs- und Notification-Mails verwenden Resend mit `MAIL_PROVIDER=resend`; `MAIL_FROM` enthält im Hosting die reine Adresse `noreply@mail.djkvfl-giesenkirchen.de`, während der Provider zentral den Anzeigenamen `DJK/VfL Giesenkirchen 05/09 e.V.` ergänzt. Alle 30 organisationsweit konfigurierbaren Notification-Typen besitzen einen Renderer. Neben einer Mannschafts-/Spieler-Notification wurden auch die drei aktivierten Tickettypen erfolgreich zugestellt.

Supabase Auth verwendet weiterhin Custom SMTP über Resend mit demselben Vereinsabsender. Ein realer Passwort-Reset wurde erfolgreich zugestellt. Offen bleiben eine optionale freigegebene Reply-To-Adresse, der erste echte Invite-Smoke sowie die abschließenden Link-/Redirect-Smokes mit der finalen produktiven Website-Domain nach der DNS-Umschaltung.

### Support-/Ticketsystem – ABGESCHLOSSEN

**B15.25 COMPLETE – LIVE VALIDATION PASSED:** Tabellen-, Security-/Permission- und atomarer RPC-Unterbau, Anwendungsschicht, Dashboard-Oberfläche, Notifications und alle drei Ticket-Mailtypen sind live verifiziert. Superadmin und berechtigter Trainer haben den vollständigen V1-Ablauf erfolgreich geprüft. Ein zusätzlicher dritter Fremdnutzer-Test wurde mangels bewusst nicht angelegtem Testaccount nicht durchgeführt und ist kein Abschlussblocker.

- Alle aktiven Dashboard-Benutzer außer dem Superadmin können eigene Tickets erstellen, ausschließlich eigene Tickets und deren Status sehen sowie innerhalb ihres Tickets antworten. Vorgesehene Status sind `Offen`, `In Bearbeitung` und `Abgeschlossen`; Ticketarten umfassen mindestens Problem/Fehler, Frage/Hilfe, Verbesserungsvorschlag und Sonstiges.
- Auswählbare Ticketbereiche werden serverseitig aus dem bestehenden Permission- und Scope-System abgeleitet. Benutzer erhalten nur tatsächlich freigegebene Arbeitsbereiche sowie einen allgemeinen Bereich wie „Allgemein / Verbesserungsvorschlag“. Manipulierte Bereiche und fremde Ticket-IDs müssen serverseitig abgewiesen werden.
- Der Superadmin erstellt grundsätzlich keine eigenen Support-Tickets, sondern erhält eine zentrale Verwaltung für alle Tickets mit Detailansicht, Filtern nach Status, Bereich, Benutzer und Datum, Antworten sowie Statuswechseln bis zum Abschluss.
- Tickets erhalten einen nachvollziehbaren Nachrichtenverlauf. Andere Benutzer dürfen weder fremde Tickets noch fremde Antworten lesen oder verändern.
- Das bestehende Dashboard-Benachrichtigungssystem informiert den Superadmin über neue Tickets und Benutzerantworten sowie den Ticket-Ersteller über Superadmin-Antworten und Statuswechsel.
- Das finale Vereins-Mail-System versendet Eingangsbestätigung, Superadmin-Benachrichtigung, Antwort-, Status- und Abschlussmails über das zentrale Vereins-Template mit HTML- und Textversion. Mailfehler dürfen erfolgreiche Ticket-, Antworts- oder Statusmutationen nicht zurückrollen und müssen kontrolliert auditiert werden; die Ticketlogik bleibt providerunabhängig.
- Architektur und Datenbankarbeiten wurden über Rollen-/Scope-Analyse, Read-only-Preflight, defensives Proposal, Rollback-Artefakt und erfolgreichen Read-only-Postcheck abgeschlossen.
- Der Live-Test mit berechtigtem Trainer und Superadmin bestätigte erlaubte Abläufe, die Superadmin-Create-Sperre, Ownership-Grundschutz, Antworten, Statuswechsel, Dashboard-Benachrichtigungen und alle vorgesehenen E-Mails. Ein dritter Fremdnutzer-Testaccount wurde bewusst nicht angelegt und ist kein Abschlussblocker.

### Contribution Reminder

Die technische Vorbereitung ist abgeschlossen, die Produktivaktivierung ausdrücklich noch nicht:

1. `CONTRIBUTION_REMINDER_CRON_SECRET` im Hosting setzen.
2. Identisches Secret im Supabase Vault hinterlegen.
3. Finalen Produktivendpunkt konfigurieren.
4. Idempotenz-Preflight und Postcheck ausführen.
5. Cron aktivieren.
6. Ersten automatischen Lauf überwachen.
7. Audit-Log prüfen.
8. Rollen-Livetest durchführen.
9. Secret-Rotation testen.
10. Funktion erst danach offiziell freigeben.

### FUSSBALL.DE

Widgetintegration, Multi-Team-Unterstützung, Spielplan-/Tabellendarstellung, Lifecycle und visuelle Einbindung sind technisch abgeschlossen. Offen bleiben die finale Produktivdomain-Freigabe, reale Mannschafts-/Widgetzuordnungen und die Desktop-/Mobile-Abnahme auf der finalen Domain.

### Finaler Go-live-Smoke

- Echtdaten-/Contentvollständigkeit bestätigen
- Legal-/Providerfreigabe abschließen
- Public, Dashboard, Rollen, Membership, Mail, Consent, externe Inhalte, Formulare, 404 und Empty States auf Desktop, Tablet und Mobile prüfen
- anschließend finale Domainumschaltung und Produktivfreigabe

## Optional / Post-Go-live

- **Support-Navigation:** „Support“ als eigenen Hauptreiter statt unter „Übersicht“ prüfen; keine Änderung am abgeschlossenen B15.25-Berechtigungsvertrag.
- **Getrennte Runtime-Diagnosen:** `getActorContext is not defined` (Digest `1973645967`) und ältere Meldungen `Failed to find Server Action ...` unabhängig von B15.25 untersuchen, sofern sie erneut reproduzierbar sind.
- **Tischtennis-Competition-Provider-Fallback:** Die bestehende myTischtennis-/click-TT-Integration funktioniert wieder. Eine WTTV-Umstellung ist [zurückgestellt und wird nur bei einem erneut wiederholten oder dauerhaften Providerproblem reaktiviert](table-tennis-competition-provider-fallback.md).
- eigenständige Gesamtvereins-„Vereinsstruktur“ erst nach einem fachlich getrennten Routen- und Datenquellenkonzept
- zusätzliche Rollen für weitere Abteilungen
- atomarer Adoption-Pfad für private unbenutzte Download-PDFs
- Notification-Pagination, Realtime-/Tab-Synchronisierung und kontrollierter Retry
- Audit-Retention und Retention terminaler Admin-E-Mail-Wechsel-Requests
- Public-Read-Spaltenminimierung für Personenstrukturen
- zusätzliche Reauth-/MFA-/Old-Mail-Approval-Härtung
- FUSSBALL.DE-AJAX-/XHR-Forschung; offizielle Widgets bleiben Fallback
- individuelle Route-Metadaten, Structured Data, eigene 404-UX und instrumentelle Kontrastmessung
- vollständiger Turniere-&-Events-Ausbau
- Google Maps Inline/Embed mit API-/Referrer-beschränktem Key und bestehendem Consent-Gate, sofern betrieblich gewünscht
- Turnierverwaltung, Community/Tauschbörse, PWA, native Android-/iOS-App und Social-Media-Automatisierung
- ESLint-/Dependency-/Dateigrößen-/Bildoptimierungsinventur

## Ersetzt / überholt

Keine aktiven Aufgaben mehr sind: eine allgemeine `persons`-Tabelle, eine separate Fußballchronik, eigenständige öffentliche Fußball-Spielerprofile, K4F2 als finale TT-Trainingslösung, originalfarbige Social-Media-Flächen, die frühere Cookie-Aufbauroute, „B15.24L nicht begonnen“, `external_integration_deferred` für Tischtennis, „B15.24H als nächster Block“, offene Notification-Mehrfachauswahl, offene saisonale Membership-Anbindung sowie ein englisches Invite-Template als eigener Designblock.

## Aktuelle Arbeitsreihenfolge

1. **All-Inkl-Bestandsaufnahme – ABGESCHLOSSEN.** `djkvfl-giesenkirchen.de` wird weiterhin im All-Inkl/KAS verwaltet und zeigt noch auf den bisherigen Webserver. DNS wurde einschließlich Web-, Mail-, Resend-, MX-, SPF- und DKIM-Kontext geprüft und vor jeder Änderung als BIND-Zonefile gesichert. Es fand keine DNS-Umschaltung statt; der gesicherte Bestand ist die Rollback-Grundlage.
2. **Hetzner für die endgültige Domain analysieren – ABGESCHLOSSEN.** `djkvfl-test.de` läuft mit Next.js, Dashboard, Node.js 24, gültigem HTTPS und dem Workflow `Deploy to Hetzner preproduction`. Nach einem Deployment bleibt der manuelle Node-Neustart in konsoleH erforderlich. Die Hauptdomain zeigt noch nicht auf Hetzner; `djkvfl-test.de` bleibt während der Vorbereitung bestehen.
3. **Mail endgültig festlegen und testen – ABGESCHLOSSEN.** Anwendungs-/Notification-Mails und Supabase-Auth-Mails verwenden erfolgreich den neuen Vereinsabsender der verifizierten Domain `mail.djkvfl-giesenkirchen.de`. Notification und Passwort-Recovery wurden real zugestellt.
4. **Ticketsystem fertigstellen – ABGESCHLOSSEN.** B15.25 und Release 1.0.13 sind einschließlich Rollen-Livetest, Dashboard-Notifications, kontrollierter Mailtyp-Aktivierung, erfolgreicher Zustellung und CTA-Prüfung abgeschlossen.
5. **Hetzner auf Produktivdomain vorbereiten – VORBEREITET / CUTOVER-RESTARBEIT OFFEN.** Zielvertrag: Node.js 24, `app.js`, Working Directory `djk-giesenkirchen-webseite`, 384 MB, keine Script-Parameter, Varnish aus, `NEXT_PUBLIC_SITE_URL=https://djkvfl-giesenkirchen.de` und `MAIL_FROM=noreply@mail.djkvfl-giesenkirchen.de`. Die Produktions-Node-Konfiguration ist nicht als dauerhaft aktiviert anzunehmen und muss beim Cutover erneut gesetzt beziehungsweise geprüft werden. `djkvfl-test.de` bleibt zunächst erhalten; SSL folgt erst bei/nach DNS-Cutover. `new.djkvfl-giesenkirchen.de` gehört nicht zur Zielarchitektur.
6. **Supabase/Auth auf Produktivdomain vorbereiten – VORBEREITET / FINALER SITE-URL-WECHSEL OFFEN.** Redirect-Ziele erlauben derzeit Test- und Produktivdomain einschließlich der jeweiligen Set-Password-Pfade. Die Site URL bleibt bis zur tatsächlichen HTTPS-Erreichbarkeit der Produktivdomain bewusst `https://djkvfl-test.de` und wird erst beim Cutover auf `https://djkvfl-giesenkirchen.de` geändert.
7. **Pre-Go-live-Komplettcheck – ABGESCHLOSSEN.** 7.1 bis 7.8 wurden erfolgreich geprüft beziehungsweise für den Go-live freigegeben; der technische Repository-Audit 7.9 ist abgeschlossen und hat keinen neuen Produktcode-Go-live-Blocker gefunden. Bekannte Baseline-Test-/ESLint-Probleme bleiben separat dokumentiert. Die noch offenen Cutover-Arbeiten gehören zu den Roadmap-Punkten 8 ff. Unvollständiger Behindertensport-Content und kleinere Inhalts-/Rollendetails sind keine Blocker. Code-Rollback, gesicherter DNS-/BIND-Ausgangszustand und Supabase Scheduled Backups sind vorhanden. Das sichtbare physische DB-Backup vom 29.09.2026 03:20:25 UTC enthält keine Storage-Objekte selbst, sondern nur deren Datenbankmetadaten; dies ist aktuell kein Go-live-Blocker.
8. **DNS bei All-Inkl umstellen – OFFEN.** Erst nach Freigabe mit gesichertem Ausgangsbestand und Rollbackplan.
9. **SSL und Hauptdomain prüfen – OFFEN.** HTTPS für `djkvfl-giesenkirchen.de` erst nach der Domainumschaltung final aktivieren und abnehmen.
10. **Produktive Mail- und Auth-Tests – TEILWEISE BEREITS VORGETESTET.** Versand über die neue Maildomain ist erfolgreich; finale Website-Links und Auth-Redirects müssen nach DNS-Umschaltung mit der echten Produktivdomain erneut getestet werden.
11. **FUSSBALL.DE und weitere domainabhängige Integrationen finalisieren – OFFEN.** Reale Zuordnungen und Desktop-/Mobile-Abnahme auf der finalen Domain durchführen.
12. **Automatische Beitragserinnerungen produktiv aktivieren – OFFEN.** Secret/Vault, Produktivendpunkt, Idempotenz, Monitoring, Rollen-Livetest und Rotation kontrolliert abschließen.
13. **Finaler Live-Test und Freigabe – OFFEN.** Abschließender Desktop-/Tablet-/Mobile-Gesamtsmoke und formale Produktivfreigabe.

## Historische Nachweise

Abgeschlossene B15.18/B15.19-Blöcke stehen kompakt in [completed-development-blocks.md](completed-development-blocks.md). Detaillierte Implementierungs-, Live-Preflight-, Proposal-, Rollback- und Postchecknachweise verbleiben unverändert in den jeweiligen `docs/planning/`- und `docs/sql/`-Dateien.
