# Projektstatus

Stand: **26. September 2026 · Version 1.0.8**

Dieses Dokument beschreibt den aktuellen As-built-Zustand. Verbindliche offene Prioritäten stehen ausschließlich in der [aktuellen Roadmap](current-roadmap.md).

## Anwendung und Betrieb

- Next.js-App mit öffentlicher Website und permissiongeschütztem Dashboard.
- Produktionsnahe Original-Webseite unter `djkvfl-test.de` auf Hetzner-Webhosting.
- Pushes auf `master` deployen den exakten Commit über den host-key-verifizierten GitHub-Actions-Workflow in einem isolierten Worktree. Der Node-Neustart erfolgt anschließend bewusst manuell in konsoleH.
- Version 1.0.7 ist committed, deployed, durch manuellen Node-Neustart aktiviert und live geprüft.
- Version 1.0.8 wurde mit öffentlichen Telefon- und E-Mail-Aktionen auf den Gesamtvorstandskarten begonnen.

## Fachlicher Stand

- Membership B15.21A–C einschließlich Geburtsdatum/Jahrgang, saisonaler Mannschaftsauflösung, Anfragearten, Zuständigkeiten und Weiterleitung ist abgeschlossen.
- Notification Center, persönliche Präferenzen, zentrale E-Mail-Delivery und globale Superadmin-Mailsteuerung einschließlich D11-Mehrfachauswahl und Sammellöschung sind abgeschlossen.
- Downloads B15.22A–E sind vollständig integriert.
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

- Der Release-1.0.7-Abschluss bestand 1412/1412 Tests, Changed-Scope ESLint ohne Fehler, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Secret-Check.
- Bekannte `no-img-element`-Warnungen bleiben ein optionaler Bildoptimierungs-/Cleanup-Punkt und sind kein aktueller Funktionsblocker.
- Weitere optionale Qualitäts- und Post-Go-live-Punkte stehen ausschließlich in der aktuellen Roadmap.
