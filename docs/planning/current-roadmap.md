# Aktuelle Roadmap

Stand: **8. Oktober 2026 · Version 1.0.14 · ZUR VERÖFFENTLICHUNG FREIGEGEBEN**

Dieses Dokument ist die verbindliche Quelle für offene, teilweise erledigte, Go-live- und optionale Arbeiten. Historische B12–B15-Planungs- und SQL-Dateien bleiben Nachweise, bilden aber keine parallele To-do-Liste.

## Erledigt

- **B15.18/B15.19:** Notification-Grundsystem, Audit, Idempotenz, zentrale Medienbibliothek, Fachintegrationen sowie die zugehörigen Security-Nachläufe. Die operative Contribution-Reminder-Aktivierung bleibt separat unter Go-live offen.
- **B15.21A–C:** gehärteter Membership-Submit, Geburtsdatum/Jahrgang, saisonale Mannschaftsfilterung und -auswahl, Anfragearten, Zuständigkeiten, Sichtbarkeit, Bearbeitung und Weiterleitung.
- **B15.21D3–D11:** reale Membership-Eingangsbestätigung, zentrale Notification-Mail-Delivery, globale Superadmin-Mailsteuerung, persönliche In-App-Präferenzen sowie Notification-Center mit Einzel-/Mehrfachauswahl, „Alle sichtbaren auswählen“ und Sammellöschen.
- **B15.22A–E:** Download-Admin-CRUD, zentrale Medienbibliothek, kontrollierter öffentlicher Dateiabruf und Footerintegration.
- **B15.23A–E:** bestehendes Personen-/Profilmodell, Security-Hardening, Dashboardprofil, Recovery, Einladung und bestätigter Admin-E-Mail-Wechsel einschließlich Auth/Profile-Synchronisierung und Guard.
- **Rollen und Security:** zentrales Permission-System, Gesamtvereins- und Department-Scopes, Football-/Tischtennis-Department-Manager, Board-Scope `club | department | unassigned`, server-only Mutationen und die verifizierten RLS-/Grant-/Policy-Härtungen.
- **B15.24A–N:** öffentliche Designbasis, Navigation, Header/Footer, Fußball, Tischtennis, Behindertensport, Gymnastikdamen, Vorstand, Trainingsrouting, Accessibility/Performance/SEO, Consent sowie zentrales E-Mail-Layout. **B15.24M COMPLETE – MANUAL CONSENT REVIEW PASSED.** Details bleiben in den jeweiligen As-built-Dokumenten.
- **Priority 7:** kontrollierte Core-, Auth-, Media- und Storage-Testdatenbereinigung samt finalem Read-only-Gesamtpostcheck.
- **Produktivbetrieb:** Die neue Vereinswebsite läuft unter `https://djkvfl-giesenkirchen.de` auf Hetzner mit Node.js 24, `app.js`, dem Working Directory `djk-giesenkirchen-webseite`, 384 MB, ohne Script-Parameter und mit deaktiviertem Varnish. GitHub-Actions-Deployment, isolierter Lockfile-Build und manueller Node-Neustart in konsoleH bleiben der etablierte Betriebsablauf.
- **Go-live 1–11 und 13:** DNS-Cutover, HTTPS/SSL, Supabase Site URL, produktive Mail-/Auth-Links, FUSSBALL.DE-/externe Integrationen und der finale Live-Smoke sind abgeschlossen. Der zentrale Versand verwendet weiterhin die verifizierte Domain `mail.djkvfl-giesenkirchen.de`.
- **B15.25 / Go-live-Punkt 4:** Support Tickets V1 einschließlich DB-/Security-Unterbau, atomarer RPCs, Dashboard-Oberfläche, Rollen- und Ownership-Vertrag, Notifications, kontrolliert aktivierter Ticket-Mails und erfolgreicher Live-Abnahme mit Trainer und Superadmin ist abgeschlossen.
- **Dashboard-UX nach 1.0.13:** Der Adminbereich verwendet `DJK/VfL Dashboard`, die Begrüßung und beide Uhren folgen `Europe/Berlin`, und Support ist mit unverändertem Permission-Vertrag als eigener letzter Hauptnavigationspunkt umgesetzt und getestet.
- **Spieler- und Mannschaftszuordnung:** Die Strukturverwaltung unterscheidet `Nicht zugeordnet`, `Ohne Mannschaft`, gültig zugeordnet und Cross-Department-Konflikt. Aktiv-/Inaktiv-/Alle-Filter sind vorhanden; aktive teamlose Spieler derselben Abteilung können zugeordnet werden. Entfernte saisonale Relationen werden deaktiviert und bei Wiederaufnahme reaktiviert, mehrere gültige Zuordnungen bleiben erlaubt.
- **BIMI-Repositoryasset:** Das unveränderte Vereinslogo liegt zusätzlich als öffentliches SVG unter `public/images/bimi-logo.svg` vor. DNS-, Provider- und Anzeigeverhalten außerhalb des Repositorys bleiben davon getrennte Betriebsfragen.

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
- **1.0.14:** Die öffentliche Footer-Navigation wurde unter „Weitere Links“ um Heimatverein und Gewerbekreis Giesenkirchen ergänzt. Beide externen Ziele öffnen sicher in einem neuen Browser-Tab; bestehende Links und responsives Layout bleiben unverändert. Implementierung, Dashboard-Changelog und automatisierte Prüfung sind abgeschlossen und zur Veröffentlichung freigegeben; Commit und Deployment stehen noch aus.

Die nächste reguläre Versionsnummer für künftige Änderungen ist **1.0.15**; sie ist noch nicht angelegt.

## In Arbeit / teilweise erledigt

### Echtdaten / Content-Befüllung

Die technische Plattform ist produktiv. `https://djkvfl-giesenkirchen.de` enthält die live freigegebene Original-Webseite mit echten Vereins-/Produktivdaten. Der noch unvollständige Behindertensport-Content sowie kleinere redaktionelle Inhalts- und Rollendetails werden nachgeführt und sind keine Go-live-Blocker.

### Legal und Provider

Impressum, Datenschutz, AGB, CMS-/Renderingintegration und Consent-Manager sind technisch umgesetzt, erreichbar und manuell geprüft. Verbleibende redaktionelle oder juristische Feinprüfungen werden getrennt nachgeführt und sind nach aktueller Betreiberbewertung keine Cutover-Blocker.

## Betriebliche Restpunkte nach Go-live

### Suchmaschinenindexierung – ABGESCHLOSSEN

`PUBLIC_SITE_INDEXING_ENABLED=true` und `NEXT_PUBLIC_SITE_URL=https://djkvfl-giesenkirchen.de` sind produktiv build-sichtbar aktiv. Nach erfolgreichem Production-Build und manuellem Node-Neustart wurden `robots.txt`, die nicht leere Sitemap mit öffentlichen Produktiv-URLs sowie der Wegfall von `noindex` auf der Startseite live bestätigt. Öffentliche Suchmaschinenindexierung ist freigegeben; `/admin/`, `/api/` und `/auth/` bleiben für Crawler gesperrt.

### E-Mail und Auth

Der produktive Mailaufbau ist festgelegt und live getestet. Anwendungs- und Notification-Mails verwenden Resend mit `MAIL_PROVIDER=resend`; `MAIL_FROM` enthält im Hosting die reine Adresse `noreply@mail.djkvfl-giesenkirchen.de`, während der Provider zentral den Anzeigenamen `DJK/VfL Giesenkirchen 05/09 e.V.` ergänzt. Alle 30 organisationsweit konfigurierbaren Notification-Typen besitzen einen Renderer. Neben einer Mannschafts-/Spieler-Notification wurden auch die drei aktivierten Tickettypen erfolgreich zugestellt.

Supabase Auth verwendet weiterhin Custom SMTP über Resend mit demselben Vereinsabsender. Site URL und Links zeigen auf die Produktivdomain. Passwort-Reset, `/set-password`, Support-/Notification-Mails und Ticket-CTAs wurden erfolgreich live geprüft. Eine optionale freigegebene Reply-To-Adresse und ein weiterer Invite-Smoke bleiben nicht blockierende Follow-ups.

### Vereins-E-Mail-System bei ALL-INKL – EXTERN GEMELDETER BETRIEBSSTAND

Dieser Abschnitt dokumentiert den vom Betreiber am 8. Oktober 2026 bestätigten externen Betriebsstand. Er ist nicht allein durch Repository-Code verifizierbar und vom Resend-/Supabase-Mailtransport der Website unabhängig.

- Eigenständige Postfächer für zuständige Vorstands- und Funktionsträger sowie Traineradressen als Weiterleitungen auf die jeweils hinterlegten privaten Empfänger sind eingerichtet. Mehrere Funktions- beziehungsweise Absenderidentitäten können einem Postfach zugeordnet sein.
- ALL-INKL WebMail, einheitliche HTML-Signaturen und E-Mail-Vorlagen mit Vereinslogo sowie mehrere funktionsbezogene Signaturen sind eingerichtet. Bei externen E-Mail-Programmen müssen die Signaturen separat konfiguriert werden; persönliche Zugangsdaten werden außerhalb des Repositorys übermittelt.
- Fünf Majordomo-Verteiler mit Empfängerlisten und Versandberechtigungen sind eingerichtet: Gesamtverein, Fußball, Fußballvorstand, Trainer und Tischtennis. Der Gesamtvereinsverteiler wurde nach Erhöhung der Majordomo-Nachrichtengrößenbegrenzung erfolgreich im Echtbetrieb getestet. Die übrigen vier Verteiler sind eingerichtet, aber noch nicht vollständig im Echtbetrieb abgenommen.
- SPF und DKIM sind eingerichtet und getestet. DMARC ist mit `p=quarantine` und `pct=100` aktiv. Der BIMI-DNS-Eintrag und die öffentliche Erreichbarkeit des SVG-Logos wurden extern geprüft; eine tatsächliche Logoanzeige bei allen E-Mail-Anbietern ist nicht bestätigt. Ein kostenpflichtiges VMC-/CMC-Zertifikat ist bewusst nicht vorgesehen.

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

### Contribution Reminder – BEWUSST ZURÜCKGESTELLT / NICHT AKTIV

Die technische Vorbereitung ist abgeschlossen, die Produktivaktivierung ausdrücklich noch nicht. Kassiererzugang und vollständige echte Beitragsdaten fehlen derzeit; automatische Erinnerungen dürfen deshalb nicht aktiviert werden:

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

Widgetintegration, Multi-Team-Unterstützung, Spielplan-/Tabellendarstellung, Lifecycle und visuelle Einbindung sind auf der Produktivdomain erfolgreich live geprüft. Es besteht kein bekannter Go-live-Blocker.

### Finaler Go-live-Smoke – ABGESCHLOSSEN

Produktivdomain, HTTPS, öffentliche Seiten, Desktop/Mobile, Dashboard, Login/Auth, Passwort-Recovery, Rollen-/Berechtigungsgrundfunktionen, Support-Tickets, Dashboard-Benachrichtigungen, E-Mail-Versand und CTAs, Downloads/Formulare sowie FUSSBALL.DE wurden erfolgreich geprüft. Es bestehen keine bekannten Go-live-blockierenden Fehler.

## Priorisierte offene Aufgaben

### Kritisch / Sicherheit / Produktivbetrieb

- Contribution Reminder ausdrücklich inaktiv lassen, bis Kassiererzugang, vollständige und kontrollierte Echtdaten, Secrets/Vault, Produktivendpunkt, Preflight/Postcheck, überwachter Erstlauf, Audit-/Rollenprüfung und Rotationstest vollständig freigegeben sind.
- Die getrennten Runtime-Meldungen `getActorContext is not defined` und `Failed to find Server Action ...` nur bei erneuter Reproduktion mit aktuellem Build untersuchen; aktuell ist kein statisch reproduzierbarer Defekt nachgewiesen.
- Nach relevanten Supabase-/GoTrue-Upgrades die upgrade-sensitiven `auth.users`-Guard-, Auth- und Compensation-Verträge erneut regressionsprüfen.
- Die Recovery-Abdeckung für Storage-Binärdateien betrieblich beobachten; der dokumentierte physische DB-Dump umfasst nur Datenbankmetadaten und keine Storage-Objekte.

### Hohe Priorität

- Die vier noch nicht vollständig abgenommenen Majordomo-Verteiler für Fußball, Fußballvorstand, Trainer und Tischtennis kontrolliert im Echtbetrieb testen und nur aggregierte Ergebnisse dokumentieren.
- Den Go-live-Mindestbestand der Echtdaten um Behindertensport-Inhalte sowie kleinere redaktionelle Inhalts- und Rollendetails vervollständigen.
- Die nach Version 1.0.13 implementierten Dashboard-, Zuordnungs- und BIMI-Nachträge bei der nächsten regulären Live-Abnahme gemeinsam bestätigen; kein eigener Release wird dafür erfunden.

### Mittlere Priorität

- Verbleibende redaktionelle beziehungsweise juristische Feinprüfung von Impressum, Datenschutz, AGB und Anbieterhinweisen abschließen.
- Optionales reales `MAIL_REPLY_TO` festlegen und den ersten echten neu eingeladenen Benutzer als operativen Invite-Smoke nutzen.
- Google Maps Inline/Embed nur bei betrieblichem Bedarf aktivieren: `GOOGLE_MAPS_EMBED_API_KEY` bereitstellen, Maps Embed API aktivieren, API-/Referrer-Beschränkung und bestehendes Consent-Gate prüfen und den Go-live-Test dokumentieren. Dieser Punkt bleibt offen und optional.
- **LEGAL CONTENT GATE – OFFEN:** Rechtliche Inhalte vor relevanten fachlichen oder technischen Änderungen erneut prüfen. Footer und `/cookie-einstellungen` öffnen dieselben zentralen Consent-Einstellungen; diese gemeinsame Bedienlogik bleibt erhalten.

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
- Turnierverwaltung, Community/Tauschbörse, PWA, native Android-/iOS-App und Social-Media-Automatisierung
- ESLint-/Dependency-/Dateigrößen-/Bildoptimierungsinventur

## Ersetzt / überholt

Keine aktiven Aufgaben mehr sind: eine allgemeine `persons`-Tabelle, eine separate Fußballchronik, eigenständige öffentliche Fußball-Spielerprofile, K4F2 als finale TT-Trainingslösung, originalfarbige Social-Media-Flächen, die frühere Cookie-Aufbauroute, „B15.24L nicht begonnen“, `external_integration_deferred` für Tischtennis, „B15.24H als nächster Block“, offene Notification-Mehrfachauswahl, offene saisonale beziehungsweise altersabhängige Membership-Mannschaftsanbindung, Support als eigener Hauptreiter sowie ein englisches Invite-Template als eigener Designblock.

## Aktuelle Arbeitsreihenfolge

1. **All-Inkl-Bestandsaufnahme – ABGESCHLOSSEN.** DNS wurde einschließlich Web-, Mail-, Resend-, MX-, SPF- und DKIM-Kontext geprüft und vor der Änderung als BIND-Zonefile gesichert. Dieser Bestand bleibt die Rollback-Grundlage.
2. **Hetzner für die endgültige Domain analysieren – ABGESCHLOSSEN.** Der analysierte Zielbetrieb ist inzwischen der aktive Produktivbetrieb unter `https://djkvfl-giesenkirchen.de`.
3. **Mail endgültig festlegen und testen – ABGESCHLOSSEN.** Anwendungs-/Notification-Mails und Supabase-Auth-Mails verwenden erfolgreich den neuen Vereinsabsender der verifizierten Domain `mail.djkvfl-giesenkirchen.de`. Notification und Passwort-Recovery wurden real zugestellt.
4. **Ticketsystem fertigstellen – ABGESCHLOSSEN.** B15.25 und Release 1.0.13 sind einschließlich Rollen-Livetest, Dashboard-Notifications, kontrollierter Mailtyp-Aktivierung, erfolgreicher Zustellung und CTA-Prüfung abgeschlossen.
5. **Hetzner auf Produktivdomain vorbereiten – ABGESCHLOSSEN.** Node.js 24, `app.js`, Working Directory `djk-giesenkirchen-webseite`, 384 MB, keine Script-Parameter, Varnish aus, `NEXT_PUBLIC_SITE_URL=https://djkvfl-giesenkirchen.de` und `MAIL_FROM=noreply@mail.djkvfl-giesenkirchen.de` sind produktiv aktiv.
6. **Supabase/Auth auf Produktivdomain vorbereiten – ABGESCHLOSSEN.** Site URL ist `https://djkvfl-giesenkirchen.de`; die Redirect-Allowlist enthält weiterhin Test- und Produktivdomain. Recovery und Set-Password wurden produktiv bestätigt.
7. **Pre-Go-live-Komplettcheck – ABGESCHLOSSEN.** 7.1 bis 7.8 wurden erfolgreich geprüft beziehungsweise für den Go-live freigegeben; der technische Repository-Audit 7.9 ist abgeschlossen und hat keinen neuen Produktcode-Go-live-Blocker gefunden. Bekannte Baseline-Test-/ESLint-Probleme bleiben separat dokumentiert. Die noch offenen Cutover-Arbeiten gehören zu den Roadmap-Punkten 8 ff. Unvollständiger Behindertensport-Content und kleinere Inhalts-/Rollendetails sind keine Blocker. Code-Rollback, gesicherter DNS-/BIND-Ausgangszustand und Supabase Scheduled Backups sind vorhanden. Das sichtbare physische DB-Backup vom 29.09.2026 03:20:25 UTC enthält keine Storage-Objekte selbst, sondern nur deren Datenbankmetadaten; dies ist aktuell kein Go-live-Blocker.
8. **DNS bei All-Inkl umstellen – ABGESCHLOSSEN.** Hauptdomain und Wildcard zeigen über die produktive IPv4 `167.235.125.56` auf Hetzner. Mail-relevante DNS-Einträge blieben unverändert; der vorherige DNS-Zustand ist als Rollback-Grundlage dokumentiert.
9. **SSL und Hauptdomain prüfen – ABGESCHLOSSEN.** `https://djkvfl-giesenkirchen.de` ist mit aktivem Let's-Encrypt-Zertifikat, HTTPS-Weiterleitung, OCSP-Stapling und TLS 1.2+ erreichbar.
10. **Produktive Mail- und Auth-Tests – ABGESCHLOSSEN.** Supabase Site URL, Passwort-Reset, Vereinsabsender, Produktivredirect, `/set-password`, Support-/Notification-Mails und Ticket-CTA wurden erfolgreich geprüft. Die veraltete build-sichtbare Testdomain in `.env.local` wurde kontrolliert korrigiert, der aktuelle Commit neu gebaut und Node manuell neu gestartet.
11. **FUSSBALL.DE und weitere domainabhängige Integrationen finalisieren – ABGESCHLOSSEN.** Die vorgesehenen Integrationen funktionieren auf der Live-Webseite ohne bekannten Go-live-Blocker.
12. **Automatische Beitragserinnerungen produktiv aktivieren – BEWUSST ZURÜCKGESTELLT / NICHT AKTIV.** Aktivierung erst nach eingerichtetem Kassiererzugang, vollständigen und kontrollierten Echtdaten, geprüfter Konfiguration, Preflight/Postcheck sowie kontrolliert überwachbarem Erstlauf.
13. **Finaler Live-Test und Freigabe – ABGESCHLOSSEN.** Der geräteübergreifende Live-Smoke ist bestanden; die neue Vereinswebsite ist produktiv freigegeben.

Damit ist der Go-live technisch und organisatorisch abgeschlossen. Punkt 12 bleibt als bewusst zurückgestellter, nicht aktiver Folgepunkt bestehen.

## Historische Nachweise

Abgeschlossene B15.18/B15.19-Blöcke stehen kompakt in [completed-development-blocks.md](completed-development-blocks.md). Detaillierte Implementierungs-, Live-Preflight-, Proposal-, Rollback- und Postchecknachweise verbleiben unverändert in den jeweiligen `docs/planning/`- und `docs/sql/`-Dateien.
