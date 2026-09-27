# Projektstatus

Stand: **27. September 2026 · Version 1.0.12**

Dieses Dokument beschreibt den aktuellen As-built-Zustand. Verbindliche offene Prioritäten stehen ausschließlich in der [aktuellen Roadmap](current-roadmap.md).

## Anwendung und Betrieb

- Next.js-App mit öffentlicher Website und permissiongeschütztem Dashboard.
- Produktionsnahe Original-Webseite unter `djkvfl-test.de` auf Hetzner-Webhosting.
- Pushes auf `master` deployen den exakten Commit über den host-key-verifizierten GitHub-Actions-Workflow in einem isolierten Worktree. Der Node-Neustart erfolgt anschließend bewusst manuell in konsoleH.
- Version 1.0.7 ist committed, deployed, durch manuellen Node-Neustart aktiviert und live geprüft.
- Version 1.0.8 wurde mit öffentlichen Telefon- und E-Mail-Aktionen auf den Gesamtvorstandskarten begonnen.
- Version 1.0.9 führt die zentrale, serverseitig permission- und departmentgeschützte Ergebnisverwaltung sowie den routenabhängigen öffentlichen Ergebnisticker für Fußball und Tischtennis ein. Dashboard und Ticker sind lokal automatisiert validiert und responsiv manuell abgenommen; Deployment, manueller Node-Neustart und Livekontrolle sind noch nicht bestätigt.
- Version 1.0.10 begrenzt die Mannschaftsbearbeitung der reinen Trainerrolle auf zugeordnete Mannschaften und die freigegebenen Bereiche Beschreibung, Training, Kader und Kontakt. Das Datenbank-Hardening wurde manuell ausgeführt und mit `overall_ok = true` postcheck-bestätigt; Deployment, Node-Neustart und Live-Rollentest sind noch nicht bestätigt.
- Version 1.0.11 präzisiert den Jugendleiter-Vertrag: allgemeine Einstellungen sind entzogen, alle fünf vorhandenen `results.*`-Permissions gelten ausschließlich für Fußball und `teams.create` bleibt unvergeben. Der Team-Season-Full-Save trennt UPDATE bestehender Zeilen von permissiongeschützten INSERTs. Der DB-Prozess ist mit 11/11 Postcheck-Blöcken und `overall_ok = true` abgeschlossen; Deployment, Node-Neustart und Live-Rollentest sind noch nicht bestätigt.
- Version 1.0.12 ergänzt die vollständige News- und Terminverwaltung für den Tischtennisvorstand mit zentralem, serverseitigem Tischtennis-Scope. Kassierer behalten alle neun Beitragsrechte, besitzen jedoch keinen Zugriff mehr auf allgemeine Einstellungen. Der DB-Prozess ist mit 46 Postcheck-Zeilen, 10/10 Diagnoseblöcken und `overall_ok = true` abgeschlossen; der Rollback blieb unbenutzt.

## Fachlicher Stand

- Membership B15.21A–C einschließlich Geburtsdatum/Jahrgang, saisonaler Mannschaftsauflösung, Anfragearten, Zuständigkeiten und Weiterleitung ist abgeschlossen.
- Notification Center, persönliche Präferenzen, zentrale E-Mail-Delivery und globale Superadmin-Mailsteuerung einschließlich D11-Mehrfachauswahl und Sammellöschung sind abgeschlossen.
- Downloads B15.22A–E sind vollständig integriert.
- Das Results-Modul besitzt eine produktiv verifizierte `club_results`-Basis, eine zentrale Admin-Verwaltung mit granularen `results.*`-Permissions und Department-Scope sowie ein server-only Public Repository für den Header-Ticker. Standardfenster, Override, aktive Strukturen, Public-Media-Auflösung und Route-Context werden vor Ausgabe zentral geprüft.
- Benutzer/Profile/Auth B15.23A–E einschließlich Recovery, Einladung, bestätigtem E-Mail-Wechsel, Guard und Compensation-Vertrag sind abgeschlossen.
- Rollen, Permissions, Department-Manager, Board-Scope sowie die relevanten RLS-/Grant-/Policy-Härtungen sind live beziehungsweise über die dokumentierten Postchecks bestätigt.
- B15.24A–N ist abgeschlossen: gemeinsame Public-Designbasis, Fußball, Tischtennis/click-TT, Behindertensport, Gymnastikdamen, Vorstand, FUSSBALL.DE-Widgets, Trainingsrouting, Accessibility/Performance/SEO, Consent und zentrales Maildesign.
- Die server-only myTischtennis-/click-TT-Competition-Integration funktioniert auf der Preproduction wieder. Der vorübergehende Hetzner-Fehler mit Provider-Weiterleitung und HTTP `429` ist dokumentiert; eine WTTV-Umstellung bleibt ein inaktiver [Fallback nur bei erneutem oder dauerhaftem Problem](table-tennis-competition-provider-fallback.md). Es besteht keine aktive Datenbankmigration.
- Version 1.0.6 ergänzte Board Responsibilities und die sichere öffentliche Lizenzanzeige. Version 1.0.7 vereinheitlichte Trainer-, Vorstands- und gemeinsam verwendete Personenkarten vertikal und responsiv. Version 1.0.8 ergänzt öffentliche Kontaktaktionen auf den Karten des Gesamtvorstands.

## Datenstand

- Priority 7 Core-, Auth-, Media- und Storage-Testdatenbereinigung ist abgeschlossen; der finale Read-only-Gesamtpostcheck war erfolgreich.
- Die Datenbank ist für echte Vereinsdaten freigegeben.
- Die schrittweise Echtdatenbefüllung läuft. Vollständige Mannschafts-, Saison-, Trainer-, Vorstands-, Sponsoren-, Kontakt-, Medien-, Download- und weitere Abteilungsinhalte sowie reale Providerzuordnungen sind noch nicht vollständig abgeschlossen.

## Security- und Betriebsverträge

- Privilegierte Mutationen prüfen zuerst Session, Permission und Fachscope; Service Role ersetzt keine Autorisierung.
- Gehärtete Fach- und Medientabellen erhalten keine direkten Browser-Schreibpfade.
- Datenbankänderungen folgen dem dokumentierten Verfahren: Read-only Preflight, defensives Proposal, Rollback-Artefakt und Read-only Postcheck. SQL wird nicht automatisch im Deployment ausgeführt.
- Der `auth.users`-Guard bleibt upgrade-sensitiv; relevante Supabase-/GoTrue-Upgrades erfordern erneute Guard-, Auth- und Compensation-Regressionen.

## Technisch abgeschlossen, betrieblich noch offen

- Finale Vereinsdomain, SSL-Endzustand, Environment-URLs, Supabase Redirects und produktive Indexierung.
- Finale Maildomain beziehungsweise finaler Mailserver, From/Reply-To, SPF/DKIM/DMARC und finale Mail-/Auth-Smokes.
- Finale Legal-/Providerprüfung trotz technisch vorhandener CMS-Rechtsseiten und funktionsfähigem Consent-Manager.
- Contribution-Reminder-Cron einschließlich Secret/Vault, Produktivendpunkt, Idempotenzprüfung, Monitoring, Rollen-Livetest und Rotation.
- FUSSBALL.DE-Domainfreigabe sowie finale reale Widget-/Mannschaftszuordnungen.
- Vollständige Echtdatenbefüllung und finaler geräteübergreifender Go-live-Smoke.

## Qualität

- Release 1.0.12: fokussierte Editorial-, Department-, Kassierer-, Contribution-, Trainer- und Jugendleiter-Regressionen, Changed-Scope ESLint, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Sensitive-Data-Check sind lokal bestanden. Die bekannte unabhängige Roadmap-Baseline zu `GOOGLE_MAPS_EMBED_API_KEY` bleibt der einzige rote Gesamttest.

- Release 1.0.11: fokussierte Jugendleiter-, Results-, Team-Season-, Trainer-, Permission- und Scope-Regressionen, Changed-Scope ESLint, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Sensitive-Data-Check sind lokal bestanden. Die Gesamtsuite bleibt ausschließlich wegen der bekannten, unabhängigen Roadmap-Baseline zur Zeichenfolge `GOOGLE_MAPS_EMBED_API_KEY` rot.
- Release 1.0.10: fokussierte Team-, Trainer-, Permission- und Scope-Regressionen, Changed-Scope ESLint, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Sensitive-Data-Check sind lokal bestanden. Die Gesamtsuite bleibt ausschließlich wegen der bekannten, unabhängigen Roadmap-Baseline zur Zeichenfolge `GOOGLE_MAPS_EMBED_API_KEY` rot.
- Release 1.0.9: fokussierte Results-/Ticker-Regressionen, Changed-Scope ESLint ohne Fehler, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Sensitive-Data-Check bestanden. Die Gesamtsuite besteht mit 1457/1458; ausschließlich der ältere Roadmap-Test zur Zeichenfolge `GOOGLE_MAPS_EMBED_API_KEY` bleibt als unabhängige Baseline rot.
- Der Release-1.0.7-Abschluss bestand 1412/1412 Tests, Changed-Scope ESLint ohne Fehler, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Secret-Check.
- Bekannte `no-img-element`-Warnungen bleiben ein optionaler Bildoptimierungs-/Cleanup-Punkt und sind kein aktueller Funktionsblocker.
- Weitere optionale Qualitäts- und Post-Go-live-Punkte stehen ausschließlich in der aktuellen Roadmap.
