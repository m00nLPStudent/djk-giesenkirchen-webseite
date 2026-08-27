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

B15.23D ist vollständig abgeschlossen. Der bestehende Admin-Einladungsflow wurde live Ende-zu-Ende verifiziert: Benutzeranlage mit Primärrolle Fußball-Vorstand und zusätzlicher Rolle Trainer, Einladung über Supabase Auth Custom SMTP/Resend, externe Zustellung, `/admin/set-password`, Passwortvergabe, Login, Session, Dashboard und bestehende Rollen-/Permission-Auswertung waren erfolgreich. Die Entwicklungs-/Übergangs-Versanddomain `mail.mavermg.de`, DKIM und Sending-CNAMEs sind verifiziert. Es war keine Code-, SQL- oder Datenbankkorrektur erforderlich. Das englische Supabase-Invite-Template und die finale SMTP-/Mailserver-Umstellung bleiben getrennte spätere Aufgaben. Nächster offener Fachpunkt gemäß Roadmap ist die E-Mail-Änderung und Auth-Synchronisierung.

## Bewusst offene Betriebs- und Folgepunkte

Finale Domain und `NEXT_PUBLIC_SITE_URL`, die Umstellung der verifizierten Auth-Custom-SMTP-Übergangslösung auf den finalen Vereins-Mailserver, Testdatenbereinigung und Echtdatenbefüllung, Contribution-Reminder-Aktivierung, Rollen-/Geräte- und Rechtsabnahme sowie das spätere zentrale Corporate-Design-Mailtemplate einschließlich des derzeit englischen Supabase-Invite-Templates bleiben offen. Persönliche E-Mail-Schalter pro Benutzer sind derzeit bewusst nicht vorgesehen; die globale Typentscheidung bleibt beim Superadmin.
