# B15.18C1 – Trainerzugriff und reduzierte Beitragsmeldungen

## Mitgliedsanfragen

Trainer erhalten keinen allgemeinen Listen- oder Suchzugriff und kein `membership_requests.view`. Der neue Detailpfad `/admin/membership-requests/[id]` prüft serverseitig folgende Beziehung:

1. Das aktive Adminprofil wird auf den aktiven Trainer über `coaches.admin_profile_id` aufgelöst.
2. Die Anfrage muss `forwarded_to_type = coach` besitzen.
3. `forwarded_to_id` muss exakt der ermittelten Trainer-ID entsprechen.

Nur dann darf der Trainer die konkrete Anfrage lesen, die vorhandene interne Notiz bearbeiten und den Status auf `in_progress` oder `done` setzen. Die Prüfung wird bei jedem Seitenaufruf und jeder Mutation erneut ausgeführt. Eine entzogene Zuweisung beendet den Zugriff sofort.

Da keine RLS-Änderung erlaubt ist, erfolgt der Datensatzschreibzugriff nach der expliziten serverseitigen Autorisierung über denselben serverseitigen Datenzugriff, den das Beitragsmodul bereits verwendet. Die ID stammt nicht aus einer Berechtigungsbehauptung des Clients; der Server lädt und prüft den Datensatz erneut.

## Sicheres Routing

Zuweisungsbenachrichtigungen enthalten die konkrete Anfrage-ID. Das DTO ergänzt die persönliche Notification-ID. Ist die Zuweisung beim Öffnen nicht mehr gültig, leitet die Detailroute auf `/admin/notifications?notification=<id>` zurück. Eine Unauthorized-Seite wird nicht verwendet.

## Beitragsstatus für Trainer

Nach einer erfolgreichen Beitrags- oder Zahlungsschreiboperation wird der Spieler aus dem vorhandenen Beitrags-DTO verwendet. Seine aktiven Zuordnungen der eindeutig aktuellen Saison werden in einem Batch geladen. Anschließend nutzt die Zustellung den vorhandenen Team-Empfängerresolver für alle aktiven Trainer dieser Mannschaften.

Trainer erhalten nur Titel, neutralen Nachrichtentext, Spieler-ID, Beitrags-ID und technische Idempotenzmetadaten. Betrag, Restbetrag, Währung, Zahlungsart, Referenz, Zahlungsdatum, Notizen und Zahlungshistorie werden nicht übernommen. Der Link ist immer `notificationDetailOnly`; Vorstand, Kassierer und Superadmin behalten die Fachroute.

## Unverändert

Keine SQL-, RLS-, Tabellen-, Rollen-, Permission-, Beitragsberechnungs-, Zahlungs- oder Notification-Tabellenänderungen. Der Actor bleibt ausgeschlossen und `createNotificationsOnce` verhindert Doppelmeldungen.
