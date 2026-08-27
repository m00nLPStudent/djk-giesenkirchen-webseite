# Projektstatus

Stand: 27. August 2026

## Gesamtstatus

- B15.18 ist technisch abgeschlossen. Die Produktivaktivierung des Contribution-Reminder-Crons bleibt ein Go-live-Thema.
- B15.19 einschließlich H, I, J, J1, J2, J2.1 und J2.2 ist im Repository abgeschlossen.
- B15.20 konsolidiert Dokumentation und Planung; es führt keine fachliche oder datenbankseitige Änderung aus.
- B15.21A–C sind abgeschlossen: öffentliches Mitglied-werden-Formular, Geburtsdatum/Jahrgang, saisonale Mannschaftsauflösung, Zuständigkeiten, Sichtbarkeit, Bearbeitung und Weiterleitung sind umgesetzt.
- B15.21D8 und D9 sind abgeschlossen: globale Superadmin-Steuerung mit standardmäßig deaktiviertem Master, 27 Typen, 16/11-Empfehlungsmatrix, sicheren Renderern und terminalen Skip-Entscheidungen ist umgesetzt.
- B15.21D10 ist abgeschlossen: Die kompakte persönliche In-App-Preference-UI behält erforderliche und optionale Semantik unverändert bei.
- B15.21D11 ist ohne SQL-Änderung abgeschlossen und im Browser freigegeben: sichtbare Mehrfachauswahl, Auswahlzähler, Filter, bestätigtes Sammellöschen, serverseitige Own-user-Bindung und das bestehende Delivery-Cascade-Verhalten sind abgedeckt.
- B15.22A–C sind abgeschlossen. Das Download-Schema ist live und nachgeprüft; Admin-CRUD, zentrale private PDF-Medienanbindung, Navigation, Superadmin-/Vorstand-/Webmaster-Zugriff, Trainer-Ausschluss, Publish/Unpublish, Usage- und Asset-erhaltende Löschsemantik wurden manuell erfolgreich geprüft. Der vollständige automatisierte Stand liegt bei 925/925 Tests.
- B15.22A–E sind funktional abgeschlossen. Schema, Admin-CRUD, zentrale Medienbibliothek, Rollen/Permissions, öffentliche Liste, kontrollierter Dateiabruf, 120-Sekunden-Signed-URL, Asset-erhaltende Löschung und Footer-Link sind umgesetzt. Die realen D/E-Tests bestätigten Abruf, URL-Ablauf, Deaktivierung mit anschließendem 404, Wiederveröffentlichung sowie „Verein → Downloads“. Der aktuelle automatisierte Stand liegt bei 935/935 Tests. Ein finaler manueller Mobile-/Design-Test wurde bewusst nicht durchgeführt und bleibt beim Website-Redesign.
- B15.23A/B/B1 sind abgeschlossen: Das bestehende Benutzer-/Rollen-/Funktionsmodell bleibt unverändert, die live bestätigten direkten Schreibrechte auf Trainer, Vorstand und Clubkontakte wurden über RLS, minimale Grants und heutige Permissions gehärtet. Postcheck und manuelle Rollen-/Public-/Media-Regression waren erfolgreich. Trainer werden regulär archiviert, nicht physisch gelöscht.
- Das Notification-Mail-System wurde über einen realen Membership-Weiterleitungsworkflow mit erfolgreicher Resend-Verarbeitung und bestätigtem Postfacheingang getestet.
- Die Adminnavigation ist in Gesamtverein, Fußball und System gegliedert; die fachlichen Zuordnungen sind in der aktuellen Roadmap und im Admin-Framework dokumentiert.
- Der aktuelle vollständige Testlauf ist einschließlich D11 und UI-Nachbesserung mit 910/910 Tests grün.
- Verbindliche aktuelle Planung: [Aktuelle Roadmap](current-roadmap.md).
- Kompakter Abschlussnachweis: [Abgeschlossene Entwicklungsblöcke](completed-development-blocks.md).
- SQL-Status und Aufbewahrungsregeln: [SQL-Register](../sql/README.md).

## Letzter abgeschlossener Fachblock

B15.23C/C1–C4 ist vollständig abgeschlossen. SQL und Postcheck sind live bestätigt; Dashboardprofil, private Avatarintegration, read-only Stammdaten, Rollen-/Passwortdarstellung, SSR-PKCE-Recovery und Auth-Mail-Rate-Limit-UX bestanden die automatisierten und manuellen Tests. Der finale Recovery-Test konnte ein neues Passwort setzen und anschließend erfolgreich anmelden. Superadmin-Verwaltung, Invite/Login, Trainer-/Vorstandsbilder, Rollenmatrix und Accountarchitektur blieben unverändert. Der nächste Fachblock kann gemäß Roadmap begonnen werden.

## Bewusst offene Betriebs- und Folgepunkte

Finale Domain und `NEXT_PUBLIC_SITE_URL`, produktive Versanddomain und Auth-SMTP, Testdatenbereinigung und Echtdatenbefüllung, Contribution-Reminder-Aktivierung, Rollen-/Geräte- und Rechtsabnahme sowie das spätere zentrale Corporate-Design-Mailtemplate bleiben offen. Persönliche E-Mail-Schalter pro Benutzer sind derzeit bewusst nicht vorgesehen; die globale Typentscheidung bleibt beim Superadmin.
