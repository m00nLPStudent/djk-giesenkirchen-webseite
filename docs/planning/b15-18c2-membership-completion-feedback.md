# B15.18C2 – Rücknavigation und Abschlussmeldung

## Ausgangslage

Die persönliche Detailfreigabe aus C1 bleibt unverändert. C2 ergänzt nur die Navigation nach erfolgreicher Trainerbearbeitung und die Rückbenachrichtigung bei einem echten Statuswechsel zu `done`.

## Weiterleitung nach Save

Nach erfolgreichem Speichern durch einen persönlich zugewiesenen Trainer navigiert der Client ausschließlich zu `/admin/notifications`. Wurde die Seite mit `?notification=<id>` geöffnet, wird genau diese ID URL-kodiert als `/admin/notifications?notification=<id>` übernommen. Es gibt weder `returnTo` noch frei wählbare oder externe Ziele. Bei jedem Fehler bleibt der Editor geöffnet.

## In Bearbeitung

Ein echter Wechsel zu `in_progress` verwendet weiterhin `membership_processing`. Da die aktuell zugewiesene Zielperson zugleich Actor ist, verhindert der zentrale Actor-Ausschluss eine Selbstmeldung. Unverändertes `in_progress` erzeugt keine Notification. Nach erfolgreicher Speicherung erfolgt die Rücknavigation.

## Erledigt

Nur `nicht done -> done` erzeugt `membership_completed`. Nach erfolgreicher Mutation und Rückgabe des aktualisierten Datensatzes werden die Policy-Empfänger bestimmt. Ein erneutes `done -> done` speichert fachlich, erzeugt aber keine weitere Abschlussmeldung.

## Empfänger und Membership-Policy

Die einzige Empfängerwahrheit bleibt `canAccessMembershipRequests`: Superadmin, berechtigter Vorstand sowie Jugendleiter/Jugendkoordinator nach der bestehenden Policy. Kassierer ohne Policy-Zugriff, andere Trainer und sonstige Benutzer werden nicht pauschal aufgenommen. Der Actor wird anschließend entfernt und Empfänger werden nach Profil-ID dedupliziert.

## Text und Datenschutz

Titel: `Mitgliedsanfrage erledigt`.

Text: `Die Mitgliedsanfrage von <Antragsteller> wurde von <Trainer> als erledigt markiert.`

Metadaten enthalten Anfrage-ID, Typ, Status, Bearbeitername, Abschlusszeitpunkt sowie vorhandene Mannschaft/Jahrgang-Daten. Adresse, Telefon, E-Mail, interne Notiz, medizinische Informationen und sonstige Antragsinhalte werden nicht übernommen.

## Zielrouten und Detail

Policy-berechtigte Empfänger öffnen `/admin/membership-requests/[id]?notification=<id>`. Der C1-Resolver prüft beim Aufruf den aktuellen Zugriff erneut. Schlägt er fehl, führt die Route zur eigenen Notification-Detailansicht zurück. Fremde oder unbekannte Notification-IDs werden weiterhin durch das Notification Center isoliert.

## Fehlerverhalten

Validierungs-, Permission-, Zuweisungs- und Datenbankfehler navigieren nicht und erzeugen keine Abschlussmeldung. Notificationfehler werden strukturiert protokolliert, rollen die bereits erfolgreiche Membership-Mutation nicht zurück und verhindern die Rücknavigation nicht.

## Tests und Risiken

Core-Tests decken Statusübergänge, Text, Metadaten, Datenschutz und Routing ab. Integrationstests prüfen Reihenfolge, Policy, Actor-Ausschluss und feste Rücknavigation. Ein manueller Test mit zwei realen Konten bleibt empfohlen, weil Rollen- und Notification-Zustände aus der Live-Datenbank benötigt werden.

## Empfehlung B15.18D

Als nächstes sollte die Zustellbeobachtung für fehlgeschlagene best-effort Notifications vereinheitlicht werden, ohne Fachmutationen zu koppeln oder neue Kanäle einzuführen.
