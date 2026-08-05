# B15.18C – Mitgliedschafts- und Beitragsbenachrichtigungen

## Architektur

Alle Ereignisse verwenden die bestehende `notifications`-Servicekette mit `createNotificationsOnce`, zentraler Zielnormalisierung und der vorhandenen Notification-Center-Detaildarstellung. Es gibt keine zweite Persistenz, Tabelle oder Idempotenzimplementierung.

Die Fachmutation wird immer zuerst vollständig abgeschlossen. Erst anschließend wird die Benachrichtigung best-effort erzeugt. Ein Notificationfehler wird protokolliert und verändert das erfolgreiche Fachergebnis nicht.

## Empfänger

- Neue Mitgliedsanfragen: aktive Adminprofile, für die die vorhandene Mitgliedsanfragen-Zugriffsregel gilt (Superadmin, berechtigter Vorstand, Jugendleiter/Jugendkoordinator).
- Zuweisung/Weiterleitung und Status: das aktive Adminprofil des ausgewählten Trainers beziehungsweise der per E-Mail identifizierte Vorstand.
- Finanzereignisse: ausschließlich aktive Superadmins, Kassierer oder Vorstände mit bestehendem `contributions.view`.
- Mitgliederstatus: aktive Trainer der betroffenen Saisonmannschaft über das vorhandene Batch-Repository.
- Der auslösende Benutzer wird grundsätzlich entfernt.

## Datenschutz

Trainerbenachrichtigungen enthalten ausschließlich Mitgliedsname und neutralen Status. Beträge, Zahlungsart, Forderungsstand, Referenzen und interne Notizen werden weder in Text noch Metadaten übernommen. Beitragsmeldungen werden nur an den vorhandenen finanzberechtigten Rollenkreis verteilt.

## Routing

Fachrouten werden nur bei vorhandener View-Permission gesetzt. Andernfalls zeigt das Notification Center die Meldung selbst. Archivierte Mitglieder sind immer Detail-only. Es wird nie absichtlich auf eine Unauthorized-Seite verwiesen.

## Tatsächlich angebundene Workflows

- Mitgliedsanfrage neu, erstmalig zugewiesen, weitergeleitet, in Bearbeitung und erledigt
- Beitrag angelegt und geändert
- Zahlung erfasst und storniert
- Beitragsstatusänderungen durch Stundung, Fortsetzung, Befreiung und Stornierung
- Mitglied aktiviert, deaktiviert und archiviert

## Nicht vorhandene Fachereignisse

Im aktuellen Projekt existieren keine separaten Aktionen für Anfrage angenommen, abgelehnt oder archiviert sowie für Zahlung bestätigt, automatische Überfälligkeit oder Zahlungserinnerungen. Die Builder unterstützen die vorgesehenen Typen, es wurde aber bewusst kein neuer Fachworkflow erfunden.
