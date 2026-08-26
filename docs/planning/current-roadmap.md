# Aktuelle Roadmap

> B15.21A bis B15.21D3 sind abgeschlossen. Die zentrale server-only Mailarchitektur und Membership-Eingangsbestätigung wurden über den echten Formularworkflow erfolgreich mit Resend verifiziert.

Stand: 26. August 2026. Dieses Dokument ist die verbindliche offene Planung. Historische B12–B15-Dateien bleiben als Nachweise erhalten, sind aber keine zweite aktuelle To-do-Liste.

## Priorität 1 – Mitglied-werden-Formular

- B15.21D3: erster kontrollierter realer Formularversand, interner Notification-Pfad, `mail_sent_at`, Resend-Verarbeitung und Postfacheingang erfolgreich verifiziert.
- Vor dem Produktivversand weiterhin Datenschutzvertrag, eigene Versanddomain, serverseitige Hosting-Secrets und Produktivumgebung verbindlich einrichten.
- Maildesign mit Vereinslogo, Vereinskopf und Footer in einem separaten Block überarbeiten.
- Einen Idempotenz-Retry nur separat und ausdrücklich freigegeben testen; D3 hat keinen Retry ausgelöst.
- Auth-Mails und normale Vereinsmails getrennt halten; Supabase Custom SMTP für Auth bleibt ein eigener Go-live-Schritt.
- Keine Edge Function, SQL- oder neue Outbox-Struktur ohne einen neu nachgewiesenen Bedarf einführen.

## Priorität 2 – Download-Modul

- Adminübersicht sowie Create/Edit.
- Direktupload und Auswahl aus der zentralen Medienbibliothek.
- vorhandene Download-Kategorien, Titel, Beschreibung, Status und Sortierung.
- öffentliche Downloadseite sowie interne Downloads und Berechtigungen.
- sichere Dateizugriffe; Versionierung nur nach eigener Anforderungsanalyse.

## Priorität 3 – Notification Center UX

- Checkbox je Notification, Einzelauswahl, Mehrfachauswahl, alle auswählen und Auswahl aufheben.
- ausgewählte eigene Notifications nach Bestätigung gemeinsam löschen; mobile Bedienung absichern.
- optional danach echte Pagination, Realtime/Tab-Synchronisierung, Retry-System und Audit-Aufbewahrung.

## Priorität 4 – Benutzer und Profile

- Einladung vollständig live testen.
- Trainer- und Vorstandskarte vom Adminprofil lösen.
- E-Mail-Änderung und Auth-Synchronisierung.
- später Rollen für weitere Abteilungen.

## Priorität 5 – Öffentliche Website

- Erscheinungsbild, Navigation, Footer und Responsive-Verhalten prüfen.
- Bereich Verein vervollständigen; Fußball und Trainingszeiten kontrollieren.
- Downloads nach Fertigstellung des Moduls integrieren.

## Priorität 6 – Weitere Abteilungen

Reihenfolge: Tischtennis, Gymnastik Damen, Behindertensport. Je Bereich später Adminmodul, öffentliche Seiten, Gruppen/Mannschaften, Ansprechpartner, Trainingszeiten, Medien, Rollen und Scopes planen.

## Priorität 7 – Datenbank-/Saison-Cleanup

- `players.team_id`, `coaches.team_id`, saisonale Relationen und Snapshotfelder.
- `team_template_id`, Legacyfelder und englische Altspalten.
- ausschließlich nach Read-/Write-Audit, Live-Preflight und gesonderter Freigabe.

## Priorität 8 – Technischer Cleanup

- bekannte Fehler in `teamCoachAssignments.core.test.mjs` und den News-UI-Strukturtests neu analysieren.
- ESLint-Bestand, Dependency-Audit, Dateigrößen und Architektur neu inventarisieren; keine alten Zahlen ungeprüft übernehmen.

## Priorität 9 – Spätere große Module

- Ticketsystem, Turnierverwaltung, Community/Tauschbörse.
- PWA, native Android-/iOS-App und Social-Media-Automatisierung.

## Priorität 10 – Go-live

- dauerhaftes Hosting, finale Domain, SSL und Mailserver.
- Umgebungsvariablen, Supabase-Produktivkonfiguration und Auth Redirect URLs.
- Einladungsmails, Passwort-Reset, Recovery und Session-Cookies.
- Echtdaten, Datenschutz, Impressum, Cookie-/Trackingprüfung und Jugendschutzdarstellung.
- vollständige Rollenabnahme und Tests auf mobilen Endgeräten.
- Contribution Reminder: `CONTRIBUTION_REMINDER_CRON_SECRET` im Hosting setzen, identisches Secret im Supabase Vault hinterlegen, finalen Produktiv-Endpunkt verwenden und keine temporäre `trycloudflare.com`-Adresse einsetzen.
- finalen Idempotenz-Preflight/Postcheck ausführen, Cron aktivieren, ersten Lauf überwachen, Audit kontrollieren, Rollen-Livetest und Secret-Rotation durchführen und die Funktion danach offiziell freigeben.

## Abgeschlossene größere Entwicklungsblöcke

Siehe [Abgeschlossene Entwicklungsblöcke](completed-development-blocks.md). B15.18 und B15.19 sowie deren dort aufgeführte Security-Nachläufe sind keine offenen Roadmap-Punkte mehr.
