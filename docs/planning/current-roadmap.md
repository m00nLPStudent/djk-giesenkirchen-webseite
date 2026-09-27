# Aktuelle Roadmap

Stand: **27. September 2026 · Version 1.0.12**

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

### Abgeschlossene Releases

- **1.0.4:** Fußball-Juniorenjahrgänge, Tischtennis-Multi-Team-Zuordnung und der dokumentierte Wartungslauf für doppelte TT-Player-Master.
- **1.0.5:** sicheres, permissiongeschütztes Löschen bestehender Termine.
- **1.0.6:** öffentliche Ausblendung von `Keine Lizenz`, Board Responsibilities, Dashboard-Aufgabenverwaltung und öffentlicher Responsibilities-Dialog.
- **1.0.7:** vertikale öffentliche Trainer- und Vorstandskarten, einheitliche responsive Gridbreiten, harmonisierte Kontaktfooter und erfolgreicher Live-Review.
- **1.0.8 (begonnen):** öffentliche Telefon- und E-Mail-Aktionen auf den Gesamtvorstandskarten.
- **1.0.9 (implementiert und lokal validiert):** permission- und departmentgeschützte Ergebnisverwaltung für Fußball und Tischtennis sowie öffentlicher, routenabhängiger Ergebnisticker. Dashboard und responsive Tickerdarstellung sind manuell abgenommen; Deployment und Livekontrolle stehen noch aus.
- **1.0.10 (implementiert und lokal validiert):** Trainer können Beschreibung, Trainingsdaten, Kader und Kontakt ausschließlich für ihre zugeordneten Mannschaften pflegen. Stammdaten, Wettbewerb, Medien und strukturelle Mutationen bleiben gesperrt. Das zugehörige DB-Hardening ist nach manuellem Proposal mit `overall_ok = true` verifiziert; Deployment, Node-Neustart und Live-Rollentest stehen noch aus.
- **1.0.11 (für Release vorbereitet):** Jugendleiter verwalten Fußball-Ergebnisse über die fünf bestehenden `results.*`-Permissions, besitzen keinen Zugriff mehr auf allgemeine Einstellungen und erhalten weiterhin kein `teams.create`. Bestehende Team-Seasons werden per UPDATE gespeichert; neue Team-Seasons bleiben create-berechtigten Rollen vorbehalten. Der DB-Prozess ist mit `overall_ok = true` abgeschlossen, Code und Tests sind lokal validiert; Deployment, Node-Neustart und Live-Rollentest stehen noch aus.
- **1.0.12 (für Release vorbereitet):** Der Tischtennisvorstand verwaltet News und Termine ausschließlich im Tischtennis-Department. Kassierer behalten die vollständige Beitragsverwaltung, besitzen aber keinen allgemeinen Settings-Zugriff mehr. Der DB-Prozess ist mit 10/10 Diagnoseblöcken und `overall_ok = true` abgeschlossen; Deployment, Node-Neustart und Live-Rollentest stehen noch aus.

## In Arbeit / teilweise erledigt

### Echtdaten / Content-Befüllung

Die technische Plattform ist produktionsfähig und die kontrollierte Testdatenbereinigung ist abgeschlossen. `djkvfl-test.de` enthält die fertige Original-Webseite auf der aktuellen Test-/Preproduction-Domain. Seit der Bereinigung wird sie schrittweise mit echten Vereins-/Produktivdaten befüllt.

Noch nicht vollständig abgeschlossen sind insbesondere:

- Mannschaften und Saisonzuordnungen
- Trainer und Betreuer
- Gesamtvereins-, Fußball- und Tischtennisvorstände
- Sponsoren und Kontakte
- Inhalte weiterer Abteilungen
- Downloads und Medien
- reale click-TT- und FUSSBALL.DE-Zuordnungen
- abschließende Prüfung aller öffentlichen Texte und Inhalte

### Legal und Provider

Impressum, Datenschutz, AGB, CMS-/Renderingintegration und Consent-Manager sind technisch umgesetzt und manuell geprüft. Offen bleiben finale Betreiber-/Vertretungsangaben, Hosting- und Mailanbieter, das endgültige Inventar externer Dienste, gegebenenfalls AV-Verträge/Drittlandtransfers sowie die abschließende juristische und betriebliche Freigabe.

## Offen vor Go-live

### Finale Domain und Environment

- finale Vereinsdomain und finaler Domain-/SSL-Zustand
- finale Environment-URLs einschließlich `NEXT_PUBLIC_SITE_URL`
- Supabase Site URL und Redirect-Allowlist
- produktive Suchmaschinenindexierung erst mit gültiger HTTPS-Domain und `PUBLIC_SITE_INDEXING_ENABLED=true`
- `robots.txt` und Sitemap auf der finalen Domain erneut prüfen

### E-Mail und Auth

Membership-, Notification-, Recovery-, Invite- und Admin-E-Mail-Wechsel-Technik sowie die zentralen Templates sind umgesetzt. Vor Go-live bleiben:

- finale Vereins-Maildomain beziehungsweise finaler Mailserver
- endgültige From-/Reply-To-Adressen
- SPF, DKIM und DMARC
- erster echter Invite-Smoke
- finale Recovery-, Membership- und Notification-Smokes
- Links aus Transaktionsmails mit der finalen `NEXT_PUBLIC_SITE_URL` prüfen

### Support-/Ticketsystem – VOR PRODUKTIV-GO-LIVE ZWINGEND ABSCHLIESSEN

**Go-live-Blocker:** Das interne Support-/Ticketsystem muss nach Vorliegen der endgültigen Domain- und Mailserver-Zugangsdaten umgesetzt, mit dem finalen Mail-System verbunden und vollständig getestet werden. Solange dieser Punkt nicht abgeschlossen ist, darf die endgültige Produktivfreigabe nicht erfolgen.

- Alle aktiven Dashboard-Benutzer außer dem Superadmin können eigene Tickets erstellen, ausschließlich eigene Tickets und deren Status sehen sowie innerhalb ihres Tickets antworten. Vorgesehene Status sind `Offen`, `In Bearbeitung` und `Abgeschlossen`; Ticketarten umfassen mindestens Problem/Fehler, Frage/Hilfe, Verbesserungsvorschlag und Sonstiges.
- Auswählbare Ticketbereiche werden serverseitig aus dem bestehenden Permission- und Scope-System abgeleitet. Benutzer erhalten nur tatsächlich freigegebene Arbeitsbereiche sowie einen allgemeinen Bereich wie „Allgemein / Verbesserungsvorschlag“. Manipulierte Bereiche und fremde Ticket-IDs müssen serverseitig abgewiesen werden.
- Der Superadmin erstellt grundsätzlich keine eigenen Support-Tickets, sondern erhält eine zentrale Verwaltung für alle Tickets mit Detailansicht, Filtern nach Status, Bereich, Benutzer und Datum, Antworten sowie Statuswechseln bis zum Abschluss.
- Tickets erhalten einen nachvollziehbaren Nachrichtenverlauf. Andere Benutzer dürfen weder fremde Tickets noch fremde Antworten lesen oder verändern.
- Das bestehende Dashboard-Benachrichtigungssystem informiert den Superadmin über neue Tickets und Benutzerantworten sowie den Ticket-Ersteller über Superadmin-Antworten und Statuswechsel.
- Das finale Vereins-Mail-System versendet Eingangsbestätigung, Superadmin-Benachrichtigung, Antwort-, Status- und Abschlussmails über das zentrale Vereins-Template mit HTML- und Textversion. Mailfehler dürfen erfolgreiche Ticket-, Antworts- oder Statusmutationen nicht zurückrollen und müssen kontrolliert auditiert werden; die Ticketlogik bleibt providerunabhängig.
- Vor der Umsetzung erfolgt eine Architekturprüfung von Rollen, Permissions, Department-/Team-Scope, Notifications, Mail-System, Templates, Audit, Admin-Profilen und RLS. Notwendige Datenbankarbeiten folgen zwingend dem etablierten Ablauf Read-only-Preflight, Proposal, Rollback und Read-only-Postcheck; Preflight und Postcheck liefern jeweils ein Statement, ein kombiniertes Resultset und einen CSV-Export mit `result_block`, `result_order`, `row_order`, `row_type` und `data`.
- Der verpflichtende Live-Test umfasst Trainer, Jugendleiter, Tischtennisvorstand, Kassierer, Vorstand, weitere relevante Rollen und Superadmin. Zu prüfen sind erlaubte und verbotene Bereiche, manipulierte Requests, eigene und fremde Tickets, Antworten, Statuswechsel, Dashboard-Benachrichtigungen, alle vorgesehenen E-Mails, das finale Template auf Desktop/Mobil sowie Mailfehler ohne Ticketdatenverlust.

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

1. Echtdaten und Content weiter einpflegen und prüfen.
2. Dabei auftretende UI-/Funktionsprobleme kontrolliert korrigieren.
3. Finale Domain- und Environmentplanung abschließen.
4. Legal-/Provider-Endprüfung durchführen.
5. Finalen Mail-/Auth-Smoke durchführen.
6. Nach Vorliegen der endgültigen Domain-/Mailserver-Zugangsdaten das verpflichtende Support-/Ticketsystem umsetzen und vollständig mit realen Rollen, Benachrichtigungen und E-Mails testen.
7. Contribution-Reminder kontrolliert in Betrieb nehmen.
8. Finalen Desktop-/Tablet-/Mobile-Gesamtsmoke durchführen.
9. Finale Domainumschaltung und Go-live.

## Historische Nachweise

Abgeschlossene B15.18/B15.19-Blöcke stehen kompakt in [completed-development-blocks.md](completed-development-blocks.md). Detaillierte Implementierungs-, Live-Preflight-, Proposal-, Rollback- und Postchecknachweise verbleiben unverändert in den jeweiligen `docs/planning/`- und `docs/sql/`-Dateien.
