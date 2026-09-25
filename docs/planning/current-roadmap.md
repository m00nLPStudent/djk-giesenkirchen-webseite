# Aktuelle Roadmap

Stand: **25. September 2026 · Version 1.0.7**

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
- Ticketsystem, Turnierverwaltung, Community/Tauschbörse, PWA, native Android-/iOS-App und Social-Media-Automatisierung
- ESLint-/Dependency-/Dateigrößen-/Bildoptimierungsinventur

## Ersetzt / überholt

Keine aktiven Aufgaben mehr sind: eine allgemeine `persons`-Tabelle, eine separate Fußballchronik, eigenständige öffentliche Fußball-Spielerprofile, K4F2 als finale TT-Trainingslösung, originalfarbige Social-Media-Flächen, die frühere Cookie-Aufbauroute, „B15.24L nicht begonnen“, `external_integration_deferred` für Tischtennis, „B15.24H als nächster Block“, offene Notification-Mehrfachauswahl, offene saisonale Membership-Anbindung sowie ein englisches Invite-Template als eigener Designblock.

## Aktuelle Arbeitsreihenfolge

1. Echtdaten und Content weiter einpflegen und prüfen.
2. Dabei auftretende UI-/Funktionsprobleme kontrolliert korrigieren.
3. Finale Domain- und Environmentplanung abschließen.
4. Legal-/Provider-Endprüfung durchführen.
5. Finalen Mail-/Auth-Smoke durchführen.
6. Contribution-Reminder kontrolliert in Betrieb nehmen.
7. Finalen Desktop-/Tablet-/Mobile-Gesamtsmoke durchführen.
8. Finale Domainumschaltung und Go-live.

## Historische Nachweise

Abgeschlossene B15.18/B15.19-Blöcke stehen kompakt in [completed-development-blocks.md](completed-development-blocks.md). Detaillierte Implementierungs-, Live-Preflight-, Proposal-, Rollback- und Postchecknachweise verbleiben unverändert in den jeweiligen `docs/planning/`- und `docs/sql/`-Dateien.
