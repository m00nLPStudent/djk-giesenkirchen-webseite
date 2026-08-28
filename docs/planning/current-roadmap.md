# Aktuelle Roadmap

> B15.21A bis B15.21D11 sind abgeschlossen. Mitgliedsanfragen, saisonale Mannschaftsauflösung, Zuständigkeiten, Weiterleitung, transaktionale Membership-Mail, zentrale Notification-Mail-Delivery, globale Superadmin-Steuerung, persönliche In-App-Preferences sowie die Notification-Center-Mehrfachauswahl sind umgesetzt und verifiziert.

Stand: 28. August 2026. Dieses Dokument ist die verbindliche offene Planung. Historische B12–B15-Dateien bleiben als Nachweise erhalten, sind aber keine zweite aktuelle To-do-Liste.

Die Adminnavigation ist in die aktiven Bereiche Gesamtverein, Fußball und System gegliedert. `/admin/department` ist als „Fußballvorstände“ dem Fußballbereich zugeordnet; Mitgliedsanfragen, Medien und der gemeinsame Einstieg „Seiten, Kontakte & Einstellungen“ bleiben unter Gesamtverein. Offener separater Folgepunkt: Eine eigenständige Gesamtvereins-„Vereinsstruktur“ erst nach Analyse und Einführung einer fachlich getrennten Gesamtvereinsroute sowie einer eindeutig zugeordneten Datenquelle planen; bis dahin keinen künstlichen Navigationseintrag oder neue Route anlegen.

## Priorität 1 – Mitgliedschaft, Notifications und transaktionale E-Mails

- B15.21A–C abgeschlossen: Das öffentliche Mitglied-werden-Formular validiert Geburtsdatum und Jahrgang serverseitig, löst saisonal passende Mannschaften auf und unterstützt die gehärteten Zuständigkeits-, Sichtbarkeits-, Bearbeitungs- und Weiterleitungsworkflows.
- B15.21D3: erster kontrollierter realer Formularversand, interner Notification-Pfad, `mail_sent_at`, Resend-Verarbeitung und Postfacheingang erfolgreich verifiziert.
- B15.21D4/D4.1 abgeschlossen: Analyse und Live-Preflight bestätigten das zentrale Delivery-Modell ohne Namenskonflikt. Das server-only Ledger-Proposal wurde anschließend manuell ausgeführt und der Postcheck bestätigte RLS, fehlende Browserrechte, ausschließlichen Service-Role-Zugriff sowie unveränderte Bestandsnotifications. Details stehen unter [`b15-21d4-notification-email-delivery-architecture.md`](b15-21d4-notification-email-delivery-architecture.md).
- B15.21D5/D6 abgeschlossen: Der zentrale Notification-Service leitet ausschließlich neu persistierte, explizit freigegebene Membership-/Trainer-Notifications an den bestehenden Mail-Service aus. Der erste reale Test erzeugte genau eine `membership_forwarded`-Notification und eine erfolgreiche `sent`-Delivery mit einem Versuch, ohne Lock, Fehler, Retry oder Doppelzustellung. Resend-Verarbeitung und Postfacheingang wurden bestätigt. Kein Cron und kein automatischer Retry wurden aktiviert.
- B15.21D8/D9 abgeschlossen: Live-Preflight, manuell ausgeführtes Schema und Postcheck bestätigten `notification_email_settings`, `notification_email_global_settings` und die server-only globale Mailpolicy. Die Superadmin-Seite `System → E-Mail-Benachrichtigungen`, der standardmäßig deaktivierte Master, 27 Type-Toggles, die 16/11-Empfehlungsmatrix, 16 sichere Renderer, Bulk-Deaktivierung und Restore sind implementiert. Master/Type/Renderer bleiben dreifach default-deny; deaktivierte Entscheidungen werden terminal `skipped` und niemals rückwirkend versendet.
- B15.21D10 abgeschlossen: Die persönlichen In-App-Benachrichtigungseinstellungen verwenden eine kompakte Desktop-Tabelle mit konsistenter Spaltengeometrie und eine kompakte Mobile-Liste. Erforderliche Notifications bleiben nicht abschaltbar; optionale Toggles, „Alle optionalen aktivieren/deaktivieren“ und „Standard wiederherstellen“ verwenden unverändert die bestehende Preference-Fachlogik.
- Persönliche E-Mail-Schalter pro Benutzer sind derzeit bewusst nicht vorgesehen. Der Superadmin bestimmt zentral, welche Notification-Typen E-Mails erzeugen; persönliche `in_app_enabled`-Preferences bleiben davon getrennt.
- Go-live-Prüfung für Notification-Mail-Links: `NEXT_PUBLIC_SITE_URL` in der Deploymentumgebung auf die finale Vereinsdomain setzen und den normalisierten `/admin`-Link prüfen. Die lokale D6-Basis-/Tunnel-URL zeigte auf Port 3000, während der Testworkflow auf Port 3001 lief; dies war kein Versandfehler und wurde nicht spontan umkonfiguriert.
- Vor dem Produktivversand weiterhin Datenschutzvertrag, eigene Versanddomain, serverseitige Hosting-Secrets und Produktivumgebung verbindlich einrichten.
- Offener späterer Block „Professionelles Vereins-E-Mail-Template / Corporate Design“: ein zentrales, wiederverwendbares Grundlayout für transaktionale Vereinsmails entwickeln, nicht nur für die Membership-Eingangsbestätigung. Vorzusehen sind das offizielle Logo des DJK/VfL Giesenkirchen, ein einheitlicher Vereinskopf im Corporate Design der Website, responsive Darstellung für Desktop und Mobilgeräte sowie ein professioneller Footer mit den notwendigen Vereins-/Impressumsangaben, Vereinsanschrift, offiziellen Kontaktmöglichkeiten, Website und gegebenenfalls Social-Media-Verweisen oder rechtlich beziehungsweise organisatorisch sinnvollen Hinweisen. Text- und HTML-Version müssen erhalten bleiben; die Umsetzung soll datensparsam, ohne unnötige Trackingelemente und in üblichen Mailclients zuverlässig darstellbar sein. Das Layout soll künftig unter anderem für Eingangsbestätigungen, Bearbeitungsinformationen, Rückfragen, Beitragsinformationen und weitere Vereinsworkflows genutzt werden können. Konkrete Vereinsdaten, endgültiges Logo und gewünschte Footer-Angaben werden vor diesem separaten Block vom Benutzer bereitgestellt.
- Einen Idempotenz-Retry nur separat und ausdrücklich freigegeben testen; D3 hat keinen Retry ausgelöst.
- Auth-Mails und normale Vereinsmails getrennt halten. Supabase Auth verwendet in der Entwicklungs-/Übergangsumgebung erfolgreich Custom SMTP über Resend mit der verifizierten Versanddomain `mail.mavermg.de`; die spätere Umstellung auf den finalen Vereins-Mailserver und die abschließende Prüfung der produktiven Absender-/Domainkonfiguration bleiben ein eigener Go-live-Schritt.
- Keine Edge Function, SQL- oder neue Outbox-Struktur ohne einen neu nachgewiesenen Bedarf einführen.

## Priorität 2 – Download-Modul

- B15.22A/A1 abgeschlossen; B15.22B live installiert und per Read-only-Postcheck bestätigt; B15.22C abgeschlossen und manuell freigegeben. Das geschützte Admin-CRUD unter `/admin/downloads`, Navigation, Rollen, Create/Edit/Delete, Publish/Unpublish, privater zentraler PDF-Upload, Picker, Usage-Synchronisation und Asset-erhaltende Löschung funktionieren. Es existiert keine zweite Upload-/Dateiverwaltung. Details: [`b15-22a-download-module-analysis.md`](b15-22a-download-module-analysis.md), [`b15-22a1-download-module-live-design.md`](b15-22a1-download-module-live-design.md) und [`../modules/downloads.md`](../modules/downloads.md).
- Optionaler späterer Komfortpunkt, kein V1-Pflichtblock: Ein bestehendes privates, unbenutztes `purpose=document`-PDF über eine künftig atomare Usage-/Purpose-Operation in `purpose=download` übernehmen. Keine race-anfällige SELECT/UPDATE-Lösung bauen; öffentliche PDFs weiterhin nicht direkt umklassifizieren.
- B15.22D abgeschlossen und manuell verifiziert: `/downloads` zeigt nur vollständig konsistente veröffentlichte Einträge in aktiven Kategorien. `GET /downloads/[id]/file` revalidiert Download, Kategorie, privates PDF-Asset und exakte Usage serverseitig und leitet erst dann auf eine 120 Sekunden gültige Signed URL weiter. Ablauf, Deaktivierung mit anschließendem 404 und Wiederveröffentlichung wurden real geprüft.
- B15.22E abgeschlossen und manuell verifiziert: Der bestehende Footer verlinkt unter „Verein“ intern auf `/downloads`; Seite und Dateiabruf funktionieren weiterhin. Damit ist B15.22A–E funktional abgeschlossen. Die finale manuelle Mobile-/Design-Abnahme wurde nicht durchgeführt und bleibt beim öffentlichen Website-Redesign; Versionierung und der optionale atomare Adoption-Pfad bleiben bis zu eigenen Anforderungsblöcken außen vor.

## Priorität 3 – B15.21D11 Notification Center UX (abgeschlossen)

- Checkbox je Notification, Einzel-/Mehrfachauswahl, Auswahlzahl, sichtbare Gesamtauswahl und bestätigtes Sammellöschen sind für Desktop und Mobile implementiert. Die kompakte Aktionsleiste enthält außerdem „Alle als gelesen markieren“; der redundante UI-Einstieg „Gelesene löschen“ ist entfernt, während der interne Bestandsvertrag erhalten bleibt.
- Der Typfilter zeigt nur tatsächlich geladene Typen mit den deutschen Labels der zentralen Preference-Registry; die Tabelle ergänzt darunter dezent den technischen Key und unbekannte Typen erhalten einen neutralen Fallback.
- „Alle auswählen“ bezeichnet ausschließlich alle aktuell geladenen und durch die aktiven Filter sichtbaren Notifications, niemals ungeprüft zukünftige paginierte Datenbankseiten; Filterwechsel leeren die Auswahl.
- Action, Service und Repository verwenden serverseitige Session-Ownership, maximal 250 normalisierte UUIDs sowie `id IN (...) AND recipient_user_id = userId`. Fremde oder fehlende IDs erzeugen kein Existenzleck.
- Die freigegebene FK-Semantik bleibt bewusst bestehen: Das Löschen einer Notification entfernt wegen `notification_deliveries.notification_id ... ON DELETE CASCADE` auch deren operative Delivery-Ledgerzeilen. Das append-only `notification_audit` bleibt unabhängig erhalten. Es war keine SQL-Änderung erforderlich. Details: [`b15-21d11-notification-center-bulk-delete-analysis.md`](b15-21d11-notification-center-bulk-delete-analysis.md).
- Der manuelle Browsertest für Desktop, Mobile, Einzel-/Mehrfachauswahl, Auswahlzähler, Filter, Read/Unread, Sammellöschung, kompakte Aktionsleiste und deutsche Typbezeichnungen ist erfolgreich abgeschlossen.
- optional danach echte Pagination, Realtime/Tab-Synchronisierung, Retry-System und Audit-Aufbewahrung.

## Priorität 4 – Benutzer und Profile

- B15.23A – Bestandsanalyse abgeschlossen. Das bestehende Auth-/Adminprofil-, Rollen-, Trainer-, Vorstands- und Kontaktmodell bleibt verbindlich bestehen; eine neue `persons`-Tabelle oder umfassende Personenmigration ist nicht geplant.
- B15.23B – Security-Analyse bestehender Trainer-/Vorstands-/Kontaktstrukturen abgeschlossen; der Read-only-Live-Preflight bestätigte die historischen direkten Browser-Schreibrechte.
- B15.23B1 – Security-Hardening für `coaches`, `board_members` und `club_contacts` live umgesetzt. RLS/Grants/Policies und service_role-only RPCs wurden per Postcheck bestätigt; Superadmin-, berechtigte Rollen-, Public-, Kontakt-, Vorstand- und Media-Browsertests bestanden. Trainer bleiben im normalen Fachworkflow archiviert statt physisch gelöscht. Public-Read-Spaltenminimierung bleibt ein separater späterer Prüfpunkt.
- B15.23C/C1–C4 – vollständig abgeschlossen. SQL/Postcheck, Dashboardprofil mit Nickname/Telefon/privatem Avatar, read-only Stammdaten, kompakter Rollen-/Passwortbereich, SSR-PKCE-Recovery und deutsche Auth-Mail-Rate-Limit-UX sind live beziehungsweise manuell bestätigt. Der finale Recovery-Test einschließlich Passwortspeicherung und anschließendem Login bestand; Trainer-/Vorstandsbilder, Superadmin-Verwaltung und Rollenmatrix blieben unverändert.
- B15.23D – vollständig abgeschlossen. Der bestehende Admin-Einladungsflow wurde live Ende-zu-Ende mit Primärrolle Fußball-Vorstand und zusätzlicher Rolle Trainer verifiziert: Benutzeranlage, Einladung über Supabase Auth Custom SMTP/Resend, externe Zustellung, `/admin/set-password`, Passwortvergabe, Login, Session, Dashboard und Rollen-/Permission-Auswertung bestanden ohne Code-, SQL- oder Datenbankkorrektur. `mail.mavermg.de` sowie DKIM und Sending-CNAMEs sind verifiziert. Das derzeit englische Supabase-Invite-Template bleibt ein späterer separater Mailtemplate-/Corporate-Design-Punkt; die finale SMTP-/Mailserver-Umstellung bleibt Go-live-Aufgabe.
- Bestehende explizite Trainer-/Vorstandslinks zum Adminprofil erhalten; keine Zuordnung oder Autorisierung über E-Mail-/Namensabgleich ausbauen.
- B15.23E – **COMPLETE – LIVE CORE FLOWS VERIFIED.** Der enge `auth.users`-Guard ist live. Self-Service-Block, Passwort, Login/Logout/Session, vollständige Recovery, Invite und E3-Forward wurden live erfolgreich bestätigt. Der finale manuelle Read-only-DB-Postcheck ist vollständig **PASS** (8/8 Abschlussprüfungen wahr, keine Pending-Zustände, keine aktiven Requests und keine Auth/Profile-Inkonsistenzen). Der zusätzliche künstliche Compensation-Livetest wird bewusst nicht ausgeführt: **COMPENSATION LIVE FAILURE INJECTION NOT EXECUTED / COMPENSATION COVERED BY AUTOMATED TESTS**. Dies ist kein Abschlussblocker. Der Guard im Supabase-managed Auth-Schema bleibt upgrade-sensitiv; nach relevanten Supabase-/GoTrue-Upgrades sind Guard-, Auth- und Compensation-Regressionen verpflichtend.
- später Rollen für weitere Abteilungen.

## Priorität 5 – B15.24 Öffentliche Website (aktiv)

- B15.24A abgeschlossen: Dokumentationskonsolidierung und vollständige Code-IST-Analyse inventarisieren 30 öffentliche Seiten, zwei öffentliche Handler, Navigation, Header, Footer, Designbasis, Responsive-Risiken, Inhalte, Datenquellen, Accessibility, Performance, SEO und rechtliche Go-live-Flächen. Details: [`b15-24a-public-website-inventory.md`](b15-24a-public-website-inventory.md).
- Die Website wird als Auftritt des Gesamtvereins mit den gleichrangigen Abteilungen Fußball, Tischtennis, Behindertensport und Gymnastikdamen weiterentwickelt. Das bestehende Grunddesign bleibt Ausgangspunkt; eine externe Referenzwebsite für Helligkeit, Flächenwirkung, Farbverteilung und Kontrast ist noch **OPEN INPUT**. Bis dahin keine finale Farbpalette festlegen.
- B15.24B – **IMPLEMENTED / PARTIAL MANUAL REVIEW COMPLETE / REMAINING WEBSITE REVIEW PENDING.** Neue Gesamtvereins-Informationsarchitektur, zugängliche Desktop- und vollständige Mobilnavigation, Floating-Navigation, Branding/Header, die vom CTA-Token `red-600` abgeleitete Hover-/Active-Hierarchie und der hervorgehobene CTA „Mitglied werden“ sind umgesetzt. Die überarbeitete dynamische Homepage verbindet News mit einer Sidebar aus mannschaftsübergreifend global sortierten Top-5-Trainingsterminen; vier lokale transparente 3D-PNG-Assets decken Fußball, Tischtennis, Gymnastik und Behindertensport ab. Neue kontrollierte öffentliche Routen, der neu strukturierte Footer und Accessibility-Verbesserungen sind enthalten. Der bisher bearbeitete Header-/Navigations-/Startseiten-/Trainingstermin-/Sporticon-Bereich wurde iterativ geprüft. **Der restliche visuelle Browser-/Designreview der öffentlichen Website wird im nächsten Arbeitsschritt fortgesetzt.** B15.24B bleibt bis dahin offen; B15.24C beginnt nicht.
- Danach folgen die zentrale Designbasis, die fachliche Befüllung von Gesamtverein und Abteilungen, Responsive/Mobile, Accessibility/Performance/SEO und die öffentliche Abschlussabnahme gemäß A-Inventar.
- `/downloads` ist funktional und bereits im Footer verlinkt; seine finale optische und mobile Integration gehört in die Gesamtvereinsseiten-/Responsive-Blöcke.

## Priorität 6 – Weitere Abteilungen

Reihenfolge: Tischtennis, Gymnastik Damen, Behindertensport. Je Bereich später Adminmodul, öffentliche Seiten, Gruppen/Mannschaften, Ansprechpartner, Trainingszeiten, Medien, Rollen und Scopes planen.

## Priorität 7 – Datenbank-/Saison-Cleanup

- `players.team_id`, `coaches.team_id`, saisonale Relationen und Snapshotfelder.
- `team_template_id`, Legacyfelder und englische Altspalten.
- ausschließlich nach Read-/Write-Audit, Live-Preflight und gesonderter Freigabe.

## Priorität 8 – Technischer Cleanup

- Die veralteten Annahmen in `teamCoachAssignments.core.test.mjs` und den beiden News-UI-Strukturtests sind korrigiert. Der aktuelle dokumentierte B15.23E-Abschlusslauf umfasst 1046/1046 bestandene Tests.
- ESLint-Bestand, Dependency-Audit, Dateigrößen und Architektur neu inventarisieren; keine alten Zahlen ungeprüft übernehmen.

## Priorität 9 – Spätere große Module

- Ticketsystem, Turnierverwaltung, Community/Tauschbörse.
- PWA, native Android-/iOS-App und Social-Media-Automatisierung.

## Priorität 10 – Go-live

- dauerhaftes Hosting, finale Domain, SSL und Mailserver.
- Umgebungsvariablen, Supabase-Produktivkonfiguration und Auth Redirect URLs.
- Einladungsmails, Passwort-Reset, Recovery und Session-Cookies.
- bestehende Testdaten vor Produktivstart kontrolliert bereinigen und anschließend Echtdaten einspielen; Datenschutz, Impressum, Cookie-/Trackingprüfung und Jugendschutzdarstellung abnehmen.
- vollständige Rollenabnahme und Tests auf mobilen Endgeräten.
- Contribution Reminder: `CONTRIBUTION_REMINDER_CRON_SECRET` im Hosting setzen, identisches Secret im Supabase Vault hinterlegen, finalen Produktiv-Endpunkt verwenden und keine temporäre `trycloudflare.com`-Adresse einsetzen.
- finalen Idempotenz-Preflight/Postcheck ausführen, Cron aktivieren, ersten Lauf überwachen, Audit kontrollieren, Rollen-Livetest und Secret-Rotation durchführen und die Funktion danach offiziell freigeben.

## Abgeschlossene größere Entwicklungsblöcke

Siehe [Abgeschlossene Entwicklungsblöcke](completed-development-blocks.md). B15.18 und B15.19 sowie deren dort aufgeführte Security-Nachläufe sind keine offenen Roadmap-Punkte mehr.
