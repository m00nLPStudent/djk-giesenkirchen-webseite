# Aktuelle Roadmap

> B15.21A bis B15.21D6 sind abgeschlossen. Die zentrale, server-only und default-deny E-Mail-Ausleitung für ausgewählte Dashboard-Notifications wurde mit einem realen Membership-Weiterleitungsworkflow, Resend-Verarbeitung und Postfacheingang erfolgreich verifiziert.

Stand: 27. August 2026. Dieses Dokument ist die verbindliche offene Planung. Historische B12–B15-Dateien bleiben als Nachweise erhalten, sind aber keine zweite aktuelle To-do-Liste.

## Priorität 1 – Mitglied-werden-Formular

- B15.21D3: erster kontrollierter realer Formularversand, interner Notification-Pfad, `mail_sent_at`, Resend-Verarbeitung und Postfacheingang erfolgreich verifiziert.
- B15.21D4/D4.1 abgeschlossen: Analyse und Live-Preflight bestätigten das zentrale Delivery-Modell ohne Namenskonflikt. Das server-only Ledger-Proposal wurde anschließend manuell ausgeführt und der Postcheck bestätigte RLS, fehlende Browserrechte, ausschließlichen Service-Role-Zugriff sowie unveränderte Bestandsnotifications. Details stehen unter [`b15-21d4-notification-email-delivery-architecture.md`](b15-21d4-notification-email-delivery-architecture.md).
- B15.21D5/D6 abgeschlossen: Der zentrale Notification-Service leitet ausschließlich neu persistierte, explizit freigegebene Membership-/Trainer-Notifications an den bestehenden Mail-Service aus. Der erste reale Test erzeugte genau eine `membership_forwarded`-Notification und eine erfolgreiche `sent`-Delivery mit einem Versuch, ohne Lock, Fehler, Retry oder Doppelzustellung. Resend-Verarbeitung und Postfacheingang wurden bestätigt. Kein Cron und kein automatischer Retry wurden aktiviert.
- Go-live-Prüfung für Notification-Mail-Links: `NEXT_PUBLIC_SITE_URL` in der Deploymentumgebung auf die finale Vereinsdomain setzen und den normalisierten `/admin`-Link prüfen. Die lokale D6-Basis-/Tunnel-URL zeigte auf Port 3000, während der Testworkflow auf Port 3001 lief; dies war kein Versandfehler und wurde nicht spontan umkonfiguriert.
- Vor dem Produktivversand weiterhin Datenschutzvertrag, eigene Versanddomain, serverseitige Hosting-Secrets und Produktivumgebung verbindlich einrichten.
- Offener späterer Block „Professionelles Vereins-E-Mail-Template / Corporate Design“: ein zentrales, wiederverwendbares Grundlayout für transaktionale Vereinsmails entwickeln, nicht nur für die Membership-Eingangsbestätigung. Vorzusehen sind das offizielle Logo des DJK/VfL Giesenkirchen, ein einheitlicher Vereinskopf im Corporate Design der Website, responsive Darstellung für Desktop und Mobilgeräte sowie ein professioneller Footer mit den notwendigen Vereins-/Impressumsangaben, Vereinsanschrift, offiziellen Kontaktmöglichkeiten, Website und gegebenenfalls Social-Media-Verweisen oder rechtlich beziehungsweise organisatorisch sinnvollen Hinweisen. Text- und HTML-Version müssen erhalten bleiben; die Umsetzung soll datensparsam, ohne unnötige Trackingelemente und in üblichen Mailclients zuverlässig darstellbar sein. Das Layout soll künftig unter anderem für Eingangsbestätigungen, Bearbeitungsinformationen, Rückfragen, Beitragsinformationen und weitere Vereinsworkflows genutzt werden können. Konkrete Vereinsdaten, endgültiges Logo und gewünschte Footer-Angaben werden vor diesem separaten Block vom Benutzer bereitgestellt.
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
