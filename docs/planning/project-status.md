# Projektstatus

Stand: 28. August 2026

## Gesamtstatus

- B15.18 ist technisch abgeschlossen. Die Produktivaktivierung des Contribution-Reminder-Crons bleibt ein Go-live-Thema.
- B15.19 einschließlich H, I, J, J1, J2, J2.1 und J2.2 ist im Repository abgeschlossen.
- B15.20 konsolidiert Dokumentation und Planung; es führt keine fachliche oder datenbankseitige Änderung aus.
- B15.21A–C sind abgeschlossen: öffentliches Mitglied-werden-Formular, Geburtsdatum/Jahrgang, saisonale Mannschaftsauflösung, Zuständigkeiten, Sichtbarkeit, Bearbeitung und Weiterleitung sind umgesetzt.
- B15.21D8 und D9 sind abgeschlossen: globale Superadmin-Steuerung mit standardmäßig deaktiviertem Master, 27 Typen, 16/11-Empfehlungsmatrix, sicheren Renderern und terminalen Skip-Entscheidungen ist umgesetzt.
- B15.21D10 ist abgeschlossen: Die kompakte persönliche In-App-Preference-UI behält erforderliche und optionale Semantik unverändert bei.
- B15.21D11 ist ohne SQL-Änderung abgeschlossen und im Browser freigegeben: sichtbare Mehrfachauswahl, Auswahlzähler, Filter, bestätigtes Sammellöschen, serverseitige Own-user-Bindung und das bestehende Delivery-Cascade-Verhalten sind abgedeckt.
- B15.22A–C sind abgeschlossen. Das Download-Schema ist live und nachgeprüft; Admin-CRUD, zentrale private PDF-Medienanbindung, Navigation, Superadmin-/Vorstand-/Webmaster-Zugriff, Trainer-Ausschluss, Publish/Unpublish, Usage- und Asset-erhaltende Löschsemantik wurden manuell erfolgreich geprüft. Der damalige Abschlussstand lag bei 925/925 Tests.
- B15.22A–E sind funktional abgeschlossen. Schema, Admin-CRUD, zentrale Medienbibliothek, Rollen/Permissions, öffentliche Liste, kontrollierter Dateiabruf, 120-Sekunden-Signed-URL, Asset-erhaltende Löschung und Footer-Link sind umgesetzt. Die realen D/E-Tests bestätigten Abruf, URL-Ablauf, Deaktivierung mit anschließendem 404, Wiederveröffentlichung sowie „Verein → Downloads“. Der damalige Abschlussstand lag bei 935/935 Tests. Ein finaler manueller Mobile-/Design-Test wurde bewusst nicht durchgeführt und bleibt beim Website-Redesign.
- B15.23A/B/B1 sind abgeschlossen: Das bestehende Benutzer-/Rollen-/Funktionsmodell bleibt unverändert, die live bestätigten direkten Schreibrechte auf Trainer, Vorstand und Clubkontakte wurden über RLS, minimale Grants und heutige Permissions gehärtet. Postcheck und manuelle Rollen-/Public-/Media-Regression waren erfolgreich. Trainer werden regulär archiviert, nicht physisch gelöscht.
- Das Notification-Mail-System wurde über einen realen Membership-Weiterleitungsworkflow mit erfolgreicher Resend-Verarbeitung und bestätigtem Postfacheingang getestet.
- Die Adminnavigation ist in Gesamtverein, Fußball und System gegliedert; die fachlichen Zuordnungen sind in der aktuellen Roadmap und im Admin-Framework dokumentiert.
- Der aktuelle dokumentierte B15.23E-Abschlusslauf ist mit 1046/1046 Tests grün.
- Verbindliche aktuelle Planung: [Aktuelle Roadmap](current-roadmap.md).
- Kompakter Abschlussnachweis: [Abgeschlossene Entwicklungsblöcke](completed-development-blocks.md).
- SQL-Status und Aufbewahrungsregeln: [SQL-Register](../sql/README.md).

## Letzter abgeschlossener Fachblock

B15.23E ist vollständig abgeschlossen und unter Commit `8b18f5441ae9c4e97c96cfc5dc8e36c0b76761cd` veröffentlicht. Der bestätigte Admin-E-Mail-Wechsel, Auth/Profile-Synchronisierung, Recovery-Korrekturen, atomare Compensation und der live aktive `auth.users`-Guard sind verifiziert; der finale Read-only-DB-Postcheck ist **PASS**. Der künstliche Compensation-Livetest wurde bewusst nicht ausgeführt und ist automatisiert abgedeckt.

## Historische B15.23E-Zwischenstände

Die folgenden E5-Zwischenstände dokumentieren die damalige Reihenfolge. Sämtliche Aussagen wie „noch nicht angewendet“ sind durch den oben genannten finalen B15.23E-PASS überholt und stellen keine offenen Aufgaben dar.

Historischer Zwischenstand E5.2.5 vor Guard-Aktivierung: Compensation-State-Migration/Postcheck waren live **PASS**. Der zentrale Claim war implementiert und getestet; kein Auth-Reverse lief mehr ohne atomaren und erneut verifizierten `compensating`-Zustand.

Historischer Zwischenstand E5.3 vor der Live-Auswertung: Der sanitisierte Read-only-Preflight für Owner, Trigger, Spalten, Pending-Counts, Namenskollisionen und den tatsächlichen `supabase_auth_admin`-Zugriff war vorbereitet.

Historischer Zwischenstand E5.3.1 vor der Guard-Aktivierung: Der manuelle Guard-Live-Preflight war **PASS** und bestätigte 26 ausschließlich interne `auth.users`-Trigger, keine Guard-Kollision, null native Pending-Zustände und keinen Request-Table-SELECT für `supabase_auth_admin`.

E5-Live-Regression: Der Guard ist live. Nativer Self-Service wird ohne Pending-Rückstand blockiert; Passwort, Login/Logout/Session, vollständige Recovery einschließlich Tunnel-Callback, Invite und E3-Forward sind live PASS. Der zusätzliche künstliche Compensation-Livetest wurde bewusst nicht ausgeführt: **NOT LIVE EXECUTED – COVERED BY AUTOMATED TESTS**. Temporäre Failure-Injection-Artefakte gehören nicht zum finalen Produktstand; der fehlende Livetest ist kein Blocker.

Historischer Zwischenstand E5.2.4: Der manuelle Compensation-State-Live-Preflight war **PASS**. Der server-only Livevertrag, vier valide Bestandszeilen und das Fehlen externer Statusabhängigkeiten waren bestätigt; Migration und Guard waren zu diesem Zeitpunkt noch nicht angewendet.

Historischer Zwischenstand E5.2.3: Der vollständige Read-only-Compensation-State-Preflight sowie DB-, Rollback- und Produktcode-Design waren vorbereitet; die damalige Stoppregel galt bis zur später erfolgreichen Live-Auswertung.

B15.23E ist technisch **COMPLETE – LIVE CORE FLOWS VERIFIED**. Der Guard blockiert den nachgewiesenen nativen Self-Service-Bypass; E3-Forward, Auth/Profile-Synchronisierung, Recovery, Invite, Passwort und Session wurden live bestätigt. Der finale manuelle Read-only-DB-Postcheck ist vollständig **PASS**; alle acht aggregierten Abschlussprüfungen sind wahr. **COMPENSATION LIVE FAILURE INJECTION NOT EXECUTED / COMPENSATION COVERED BY AUTOMATED TESTS.** Der Guard im Supabase-managed Auth-Schema bleibt upgrade-sensitiv und verlangt nach relevanten Supabase-/GoTrue-Upgrades erneute Guard-, Auth- und Compensation-Regressionen. Corporate-Design-Mailtemplate, Retention/Cleanup sowie optionale Reauth-/MFA-/Old-Mail-Approval-Härtung bleiben separat offen.

## Aktueller Fachblock

B15.24A ist als reiner Analyse-/Dokumentationsblock abgeschlossen. Der tatsächliche öffentliche Codebestand umfasst 30 Seiten und zwei Handler. Die Website ist künftig als Gesamtvereinsauftritt mit Fußball, Tischtennis, Behindertensport und Gymnastikdamen zu strukturieren. Nächster Umsetzungs-/Entscheidungsblock ist B15.24B – Gesamtvereins-Informationsarchitektur und Navigation. Die externe visuelle Referenz bleibt Input für B15.24C; eine finale Farbentscheidung wurde nicht getroffen.

## Bewusst offene Betriebs- und Folgepunkte

Finale Domain und `NEXT_PUBLIC_SITE_URL`, die Umstellung der verifizierten Auth-Custom-SMTP-Übergangslösung auf den finalen Vereins-Mailserver, Testdatenbereinigung und Echtdatenbefüllung, Contribution-Reminder-Aktivierung, Rollen-/Geräte- und Rechtsabnahme sowie das spätere zentrale Corporate-Design-Mailtemplate einschließlich des derzeit englischen Supabase-Invite-Templates bleiben offen. Persönliche E-Mail-Schalter pro Benutzer sind derzeit bewusst nicht vorgesehen; die globale Typentscheidung bleibt beim Superadmin.
