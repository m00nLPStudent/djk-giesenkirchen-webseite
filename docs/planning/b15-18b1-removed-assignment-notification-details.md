# B15.18B1 – Sichere Detailanzeige entfernter Zuordnungen

## Zielbild

Benachrichtigungen über entfernte Spieler- und Trainerzuordnungen sowie archivierte Mannschaften führen in das persönliche Notification Center. Dort wird die vollständige Meldung angezeigt, ohne eine nach dem Rechteverlust unzugängliche Fachroute aufzurufen.

## Zielauflösung

- `player_removed`, `trainer_removed` und Mannschaftsarchivierungen erhalten `accessLost` und `notificationDetailOnly`.
- Der zentrale Resolver setzt für diese Ereignisse `/admin/notifications` als persistiertes, internes Ziel.
- Das DTO ergänzt beim Lesen die eigene Notification-ID: `/admin/notifications?notification=<id>`.
- Auch bereits gespeicherte `player_removed`- und `trainer_removed`-Meldungen werden dadurch ohne Migration sicher aufgelöst.
- Zugeordnete oder geänderte Datensätze behalten die vorhandene permission-basierte Fachroute.

## Detailansicht und Sicherheit

Die Seite sucht die angeforderte ID ausschließlich in der bereits nach `recipient_user_id` geladenen Liste des angemeldeten Benutzers. Fremde, gelöschte oder unbekannte IDs öffnen keine Detailansicht. Eine gültige ungelesene Meldung wird über dieselbe benutzergebundene Repository-Funktion als gelesen markiert. Die Auswahl ist in Tabelle und Karte sichtbar hervorgehoben.

## Inhalte

Die Detailansicht enthält Titel, vollständigen Nachrichtentext, Typ, Zeitpunkt, Lesestatus sowie vorhandene Mannschafts-, Saison- und Rollenmetadaten. Bei einer entfernten Trainerzuordnung weist der Text ausdrücklich darauf hin, dass der Zugriff auf die Mannschaft beendet ist. Mannschaftsarchivierungen werden als eigenes Ereignis an die zuvor zugeordneten Trainer verteilt.

## Unveränderte Bereiche

Keine Datenbank-, SQL-, RLS-, Permission-, Scope-, Rollen-, Routing- oder Fachlogikänderungen. Es gibt keine Service-Role, keinen globalen Bypass und keine neue Route.
