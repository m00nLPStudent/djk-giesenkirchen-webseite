# Projektstatus

Stand: **8. Oktober 2026 · Version 1.0.13 · PRODUKTIV / LIVE**

Dieses Dokument beschreibt den aktuellen As-built-Zustand. Verbindliche offene Prioritäten stehen ausschließlich in der [aktuellen Roadmap](current-roadmap.md).

## Anwendung und Betrieb

- Next.js-App mit öffentlicher Website und permissiongeschütztem Dashboard.
- Produktive Vereinswebsite unter `https://djkvfl-giesenkirchen.de` auf Hetzner-Webhosting.
- Pushes auf `master` deployen den exakten Commit über den host-key-verifizierten GitHub-Actions-Workflow in einem isolierten Worktree. Der Node-Neustart erfolgt anschließend bewusst manuell in konsoleH.
- Hauptdomain und Wildcard zeigen über `167.235.125.56` auf Hetzner. Mail-relevante DNS-Einträge blieben unverändert; der private BIND-Ausgangsbestand bleibt die Rollbackgrundlage.
- HTTPS ist mit Let's Encrypt, Weiterleitung, OCSP-Stapling und TLS 1.2+ aktiv. Node.js 24 läuft mit `app.js`, Working Directory `djk-giesenkirchen-webseite`, 384 MB, ohne Script-Parameter und mit deaktiviertem Varnish.
- `NEXT_PUBLIC_SITE_URL=https://djkvfl-giesenkirchen.de` und der bestehende produktive `MAIL_FROM`-Vertrag sind aktiv. Nach Korrektur des zuvor build-sichtbaren Testdomainwerts in der serverseitigen `.env.local` wurde der aktuelle Commit über den abgesicherten Deploymentweg neu gebaut und Node manuell neu gestartet.
- Supabase Site URL ist `https://djkvfl-giesenkirchen.de`; die Redirect-Allowlist enthält weiterhin Test- und Produktivdomain. Recovery, `/set-password`, Support-/Notification-Mails und Produktiv-CTAs wurden erfolgreich geprüft.
- Version 1.0.7 ist committed, deployed, durch manuellen Node-Neustart aktiviert und live geprüft.
- Versionen 1.0.8 bis 1.0.12 einschließlich öffentlicher Vorstandskontakte, Ergebnisverwaltung/-ticker sowie der gehärteten Trainer-, Jugendleiter-, Tischtennisvorstand- und Kassierer-Verträge sind deployed und live geprüft.
- Version 1.0.13 schließt B15.25 Support Tickets V1 ab. Nach dem Permission-Guard-Hotfix wurden Superadmin- und Trainerpfad, Ticket-Erstellung, Antworten, Status/Priorität/Zuweisung, Abschluss/Wiederöffnung, Dashboard-Benachrichtigungen und die drei kontrolliert aktivierten Ticket-Mailtypen live erfolgreich geprüft.
- Nach Version 1.0.13 wurden ohne neue Releaseversion der Dashboardtitel, die `Europe/Berlin`-Begrüßung und -Uhren sowie Support als eigener letzter permissiongefilterter Hauptnavigationspunkt implementiert und automatisiert geprüft.
- Ebenfalls umgesetzt ist die präzisierte Spieler-/Mannschaftszuordnung mit eigenem Zustand `Ohne Mannschaft`, Aktiv-/Inaktiv-/Alle-Filtern, Auswahl aktiver teamloser Spieler derselben Abteilung sowie Deaktivierung und Wiederaufnahme vorhandener saisonaler Relationen ohne Dubletten. Cross-Department-Schutz und gültige Mehrfachzuordnungen bleiben erhalten.
- `public/images/bimi-logo.svg` stellt das Vereinslogo als öffentliches Repositoryasset für den extern konfigurierten BIMI-Vertrag bereit.

## Fachlicher Stand

- Membership B15.21A–C einschließlich Geburtsdatum/Jahrgang, saisonaler Mannschaftsauflösung, Anfragearten, Zuständigkeiten und Weiterleitung ist abgeschlossen.
- Notification Center, persönliche Präferenzen, zentrale E-Mail-Delivery und globale Superadmin-Mailsteuerung einschließlich D11-Mehrfachauswahl und Sammellöschung sind abgeschlossen.
- Der produktive Mailaufbau ist abgeschlossen und live getestet: Resend versendet Anwendungs-/Notification-Mails mit der verifizierten Domain `mail.djkvfl-giesenkirchen.de`; alle 30 konfigurierbaren Notification-Typen besitzen Renderer. Eine Mannschafts-/Spieler-Notification sowie alle drei aktivierten Tickettypen wurden erfolgreich zugestellt. Supabase Auth verwendet weiterhin Custom SMTP über Resend mit demselben Vereinsabsender; ein realer Passwort-Reset wurde erfolgreich zugestellt.
- Downloads B15.22A–E sind vollständig integriert.
- Das Results-Modul besitzt eine produktiv verifizierte `club_results`-Basis, eine zentrale Admin-Verwaltung mit granularen `results.*`-Permissions und Department-Scope sowie ein server-only Public Repository für den Header-Ticker. Standardfenster, Override, aktive Strukturen, Public-Media-Auflösung und Route-Context werden vor Ausgabe zentral geprüft.
- Benutzer/Profile/Auth B15.23A–E einschließlich Recovery, Einladung, bestätigtem E-Mail-Wechsel, Guard und Compensation-Vertrag sind abgeschlossen.
- Rollen, Permissions, Department-Manager, Board-Scope sowie die relevanten RLS-/Grant-/Policy-Härtungen sind live beziehungsweise über die dokumentierten Postchecks bestätigt.
- B15.24A–N ist abgeschlossen: gemeinsame Public-Designbasis, Fußball, Tischtennis/click-TT, Behindertensport, Gymnastikdamen, Vorstand, FUSSBALL.DE-Widgets, Trainingsrouting, Accessibility/Performance/SEO, Consent und zentrales Maildesign.
- Die server-only myTischtennis-/click-TT-Competition-Integration funktioniert auf der Preproduction wieder. Der vorübergehende Hetzner-Fehler mit Provider-Weiterleitung und HTTP `429` ist dokumentiert; eine WTTV-Umstellung bleibt ein inaktiver [Fallback nur bei erneutem oder dauerhaftem Problem](table-tennis-competition-provider-fallback.md). Es besteht keine aktive Datenbankmigration.
- Version 1.0.6 ergänzte Board Responsibilities und die sichere öffentliche Lizenzanzeige. Version 1.0.7 vereinheitlichte Trainer-, Vorstands- und gemeinsam verwendete Personenkarten vertikal und responsiv. Version 1.0.8 ergänzt öffentliche Kontaktaktionen auf den Karten des Gesamtvorstands.

## Vereins-E-Mail-System bei ALL-INKL – extern bestätigt

Der folgende Stand wurde am 8. Oktober 2026 administrativ außerhalb des Repositorys bestätigt und ist vom Resend-/Supabase-Mailtransport der Website getrennt:

- Eigenständige Postfächer für Vorstands- und Funktionsträger, Trainerweiterleitungen sowie mehrere Funktions-/Absenderidentitäten je Postfach sind eingerichtet.
- ALL-INKL WebMail, einheitliche HTML-Signaturen und E-Mail-Vorlagen mit Vereinslogo sowie mehrere funktionsbezogene Signaturen sind eingerichtet. Externe Mailprogramme benötigen eine separate Signaturkonfiguration; Zugangsdaten werden nicht im Repository verwaltet.
- Fünf Majordomo-Verteiler mit Empfängerlisten und Versandberechtigungen sind eingerichtet. Der Gesamtvereinsverteiler wurde nach Anpassung der Nachrichtengrößenbegrenzung erfolgreich real getestet; Fußball, Fußballvorstand, Trainer und Tischtennis sind eingerichtet, aber noch nicht vollständig im Echtbetrieb abgenommen.
- SPF und DKIM sind getestet, DMARC ist mit `p=quarantine` und `pct=100` aktiv. BIMI-DNS und öffentliches SVG wurden extern geprüft. Eine flächendeckende Logoanzeige bei Mailanbietern ist nicht bestätigt; ein kostenpflichtiges VMC-/CMC-Zertifikat ist bewusst nicht vorgesehen.

## Datenstand

- Priority 7 Core-, Auth-, Media- und Storage-Testdatenbereinigung ist abgeschlossen; der finale Read-only-Gesamtpostcheck war erfolgreich.
- Die Datenbank ist für echte Vereinsdaten freigegeben.
- Der für den Go-live erforderliche Vereins-/Produktivdatenbestand ist eingepflegt. Die redaktionelle Vollständigkeit ist noch nicht erreicht: Behindertensport-Content sowie kleinere Inhalts- und Rollendetails werden nachgeführt und blockieren den Betrieb nicht.

## Security- und Betriebsverträge

- Privilegierte Mutationen prüfen zuerst Session, Permission und Fachscope; Service Role ersetzt keine Autorisierung.
- Gehärtete Fach- und Medientabellen erhalten keine direkten Browser-Schreibpfade.
- Datenbankänderungen folgen dem dokumentierten Verfahren: Read-only Preflight, defensives Proposal, Rollback-Artefakt und Read-only Postcheck. SQL wird nicht automatisch im Deployment ausgeführt.
- Der `auth.users`-Guard bleibt upgrade-sensitiv; relevante Supabase-/GoTrue-Upgrades erfordern erneute Guard-, Auth- und Compensation-Regressionen.

## Technisch abgeschlossen, betrieblich noch offen

- Das verpflichtende Support-/Ticketsystem ist abgeschlossen und produktiv verifiziert. DB/RLS/ACL/Permissions, atomare RPCs, Application Layer, Dashboard-UI, Rollen-/Ownership-Vertrag, Notifications, Ticket-Mails und Produktiv-CTA funktionieren live.
- Der Pre-Go-live-Komplettcheck ist abgeschlossen: 7.1 bis 7.8 sind erfolgreich geprüft beziehungsweise für den Go-live freigegeben, und der technische Repository-Audit 7.9 fand keinen neuen Produktcode-Go-live-Blocker. Bekannte Baseline-Test-/ESLint-Probleme bleiben separat dokumentiert; die offenen Cutover-Arbeiten folgen unter den Roadmap-Punkten 8 ff. Noch unvollständiger Behindertensport-Content sowie kleinere Inhalts- oder Rollenfeinheiten sind ausdrücklich keine Cutover-Blocker.
- Rollback und Backup sind über Git/GitHub, den gesicherten DNS-/BIND-Ausgangszustand und Supabase Scheduled Backups abgedeckt. Das sichtbare physische Backup vom 29.09.2026 03:20:25 UTC umfasst keine Storage-Objekte selbst, sondern nur deren Datenbankmetadaten; dies ist aktuell kein Go-live-Blocker.
- Die Suchmaschinenindexierung ist kontrolliert freigegeben: `PUBLIC_SITE_INDEXING_ENABLED=true` ist produktiv build-sichtbar aktiv. Nach erfolgreichem Production-Build und manuellem Node-Neustart wurden `robots.txt` mit öffentlicher Freigabe und fortbestehenden Sperren für `/admin/`, `/api/` und `/auth/`, die nicht leere Sitemap mit Produktiv-URLs sowie der Wegfall von `noindex` auf der Startseite live bestätigt.
- Optionales reales Reply-To und ein weiterer Invite-Smoke bleiben nicht blockierende Follow-ups. Maildomain, From-Vertrag, Auth-SMTP und Produktivlinks sind abgeschlossen und live getestet.
- Impressum, Datenschutz und Downloads sind vorhanden und erreichbar. Verbleibende redaktionelle oder juristische Feinprüfungen werden getrennt nachgeführt und sind nach aktueller Betreiberbewertung kein Cutover-Blocker.
- Contribution-Reminder-Cron bleibt bewusst inaktiv, bis Kassiererzugang und vollständige echte Beitragsdaten vorliegen und die bestehende Aktivierungscheckliste vollständig abgearbeitet werden kann.
- Nicht blockierende Inhaltsnachpflege bleibt separat; der finale geräteübergreifende Go-live-Smoke und die vorgesehenen FUSSBALL.DE-Integrationen sind bestanden.
- Nicht blockierende, von B15.25 getrennte Follow-ups: eine separate Reproduktionsanalyse für `getActorContext is not defined` (Digest `1973645967`) und ältere `Failed to find Server Action ...`-Meldungen, sofern sie mit aktuellem Build erneut auftreten. Die eigene Support-Hauptnavigation ist bereits umgesetzt und kein offener Punkt mehr.
- Google Maps Inline/Embed bleibt optional offen. Bei Aktivierung sind `GOOGLE_MAPS_EMBED_API_KEY`, Maps Embed API, API-/Referrer-Beschränkung, Consent-Gate und ein kontrollierter Go-live-Test erforderlich.

Der Go-live ist damit technisch und organisatorisch abgeschlossen. Die automatischen Beitragserinnerungen bleiben als bewusst zurückgestellter, nicht aktiver Folgepunkt bestehen.

## Qualität

- Release 1.0.12: fokussierte Editorial-, Department-, Kassierer-, Contribution-, Trainer- und Jugendleiter-Regressionen, Changed-Scope ESLint, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Sensitive-Data-Check sind lokal bestanden. Die bekannte unabhängige Roadmap-Baseline zu `GOOGLE_MAPS_EMBED_API_KEY` bleibt der einzige rote Gesamttest.

- Release 1.0.11: fokussierte Jugendleiter-, Results-, Team-Season-, Trainer-, Permission- und Scope-Regressionen, Changed-Scope ESLint, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Sensitive-Data-Check sind lokal bestanden. Die Gesamtsuite bleibt ausschließlich wegen der bekannten, unabhängigen Roadmap-Baseline zur Zeichenfolge `GOOGLE_MAPS_EMBED_API_KEY` rot.
- Release 1.0.10: fokussierte Team-, Trainer-, Permission- und Scope-Regressionen, Changed-Scope ESLint, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Sensitive-Data-Check sind lokal bestanden. Die Gesamtsuite bleibt ausschließlich wegen der bekannten, unabhängigen Roadmap-Baseline zur Zeichenfolge `GOOGLE_MAPS_EMBED_API_KEY` rot.
- Release 1.0.9: fokussierte Results-/Ticker-Regressionen, Changed-Scope ESLint ohne Fehler, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Sensitive-Data-Check bestanden. Die Gesamtsuite besteht mit 1457/1458; ausschließlich der ältere Roadmap-Test zur Zeichenfolge `GOOGLE_MAPS_EMBED_API_KEY` bleibt als unabhängige Baseline rot.
- Der Release-1.0.7-Abschluss bestand 1412/1412 Tests, Changed-Scope ESLint ohne Fehler, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Secret-Check.
- Bekannte `no-img-element`-Warnungen bleiben ein optionaler Bildoptimierungs-/Cleanup-Punkt und sind kein aktueller Funktionsblocker.
- Weitere optionale Qualitäts- und Post-Go-live-Punkte stehen ausschließlich in der aktuellen Roadmap.
