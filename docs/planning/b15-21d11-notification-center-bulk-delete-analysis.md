# B15.21D11 – Notification Center: Mehrfachauswahl und Sammellöschen

Stand: 27. August 2026. Analyse und Implementierung sind abgeschlossen, die dokumentierte Delivery-Cascade-Semantik wurde ausdrücklich freigegeben und der manuelle Browsertest für Desktop und Mobile ist bestanden. Es wurde kein SQL ausgeführt, erstellt oder verändert. B15.21D11 ist final freigegeben.

## Bestehender Pfad

`/admin/notifications` lädt höchstens 250 eigene Notifications. Desktop und Mobile verwenden dieselbe bereits geladene DTO-Liste; Such-, Status- und Typfilter werden im Client darauf angewendet. Die Glocke lädt separat höchstens acht Einträge und bleibt außerhalb der geplanten Auswahlfunktion.

Eine Einzellöschung läuft über `deleteNotificationAction(id)`. `getContext()` authentifiziert serverseitig mit `assertAdminActionPermission({})` und leitet `auth.userId` ab. Service und Repository erhalten diese serverseitige ID; `deleteNotificationFromRepository` filtert gleichzeitig auf `id` und `recipient_user_id`. Eine vom Client gelieferte ID ist daher kein Autorisierungsnachweis.

`deleteAllReadNotificationsAction()` und `deleteAllRead()` existieren bereits. Das Repository löscht nur Zeilen mit dem serverseitigen `recipient_user_id` und `is_read = true`. `notifications_delete_own` erlaubt DELETE zusätzlich nur bei `recipient_user_id = auth.uid()`. Authenticated besitzt DELETE, aber keine INSERT-Policy; RLS ist eine zweite Schutzschicht hinter der serverseitigen Scope-Bildung.

## Implementierter sicherer Sammelpfad

Die reine Core-Funktion `normalizeNotificationIds` akzeptiert nur Arrays, trimmt und normalisiert UUID-Strings, entfernt Duplikate, ignoriert Leerstrings und begrenzt den Request auf 250 Einträge. Leere, ungültige und zu große Auswahlen liefern kontrollierte Fehlergründe. Die Server Action ermittelt den Benutzer weiterhin ausschließlich aus der Session und übergibt keine Client-User-ID. `deleteSelectedNotificationsForUser` kombiniert zwingend `.in("id", notificationIds)` und `.eq("recipient_user_id", userId)`. Gemischte eigene, fremde und fehlende IDs können nur eigene vorhandene Zeilen treffen; das Ergebnis enthält lediglich `deletedCount` und keine ID- oder Fehlerdetails.

Kein SQL erforderlich. Das bestehende Schema, DELETE-Grant und die Own-row-RLS reichen für denselben Löschvorgang mit einer normalisierten ID-Liste aus. Policies oder Grants werden nicht erweitert. Sollte die Delivery-Aufbewahrungsentscheidung geändert werden, ist das ausdrücklich ein separater Datenbankblock mit Preflight, Proposal, Rollback und Postcheck.

## Delivery-Ledger, Audit und Monitoring

`notification_deliveries.notification_id` referenziert `notifications(id)` mit `ON DELETE CASCADE`. Jede heutige Einzel- oder Gelesenen-Löschung entfernt deshalb bereits automatisch die zugehörige Delivery-Zeile, einschließlich `sent` oder `skipped`. Eine Sammellöschung würde dieselbe Semantik lediglich auf mehrere ausgewählte Notifications anwenden.

Das Ledger ist als operationaler Delivery-State beschrieben, nicht als unveränderliches Audit. Die bestehende Semantik kann für D11 beibehalten werden, wenn fachlich akzeptiert wird, dass eine persönliche Inbox-Löschung auch den zugehörigen operativen Zustellnachweis entfernt. Vorteil: keine verwaisten Ledgerzeilen und keine neue Datenhaltung. Nachteil: Delivery-Statistiken und Providerdiagnose können nach Benutzerlöschung nicht mehr aus dem Ledger rekonstruiert werden. Vor Implementierung ist diese bewusste Freigabe erforderlich. Eine andere Entscheidung – etwa Soft Delete oder Erhalt des Ledgers bei gelöschter Inboxzeile – benötigt ein neues Datenmodell und SQL und gehört nicht in den kleinen D11-UX-Block.

`notification_audit` besitzt keine FK-Verbindung zur Notification und bleibt append-only erhalten. Aggregierte Erzeugungs-, Fehler-, Skip- und Idempotenzereignisse bleiben damit im Monitoring verfügbar. Delivery-bezogene Ansichten können nach einem Cascade-Delete weniger operative Zeilen sehen; ein Retry gelöschter Deliveries ist anschließend unmöglich. Da D5 keinen automatischen Retry aktiviert und `sent`/`skipped` terminal sind, entsteht kein unbeabsichtigter Nachversand.

## UX-Semantik

- Jede im vollständigen Notification Center dargestellte Zeile erhält eine gut bedienbare Checkbox; die Glocke erhält keine Auswahlsteuerung.
- „Alle auswählen“ wählt ausschließlich die aktuell geladenen und unter Such-, Status- und Typfilter sichtbaren Notifications aus.
- Ein Filterwechsel gleicht die Auswahl mit den weiter vorhandenen geladenen Elementen ab; nicht sichtbare Auswahl darf nicht stillschweigend mitgelöscht werden. Empfohlen ist, die Auswahl auf die aktuell sichtbaren IDs zu begrenzen.
- „Alle abwählen“ leert die Auswahl vollständig.
- Die Anzahl ausgewählter sichtbarer Notifications wird angezeigt.
- Sammellöschen ist ohne Auswahl deaktiviert und verlangt eine Bestätigung mit Anzahl.
- Nach erfolgreicher Löschung werden nur bestätigte eigene IDs aus dem lokalen Zustand entfernt und die Auswahl wird geleert.
- Read/Unread, „Alle als gelesen“, Suche, Filter, Detailansicht und Einzellöschung bleiben erhalten. „Alle als gelesen“ befindet sich in der kompakten Listenleiste; der redundante sichtbare Einstieg „Gelesene löschen“ wurde nach Browserabnahme entfernt, während `deleteAllRead` intern bestehen bleibt.
- Der Typfilter verwendet für die dynamisch aus geladenen Notifications abgeleiteten Optionen die deutschen Labels der zentralen Preference-Registry. Unbekannte Typen erhalten einen neutralen Fallback; in der Desktop-Tabelle bleibt der technische Key dezent unter dem Label sichtbar.
- Desktop integriert eine schmale Auswahlspalte in die bestehende Tabelle. Mobile erhält eine Checkbox ohne horizontale Scrollfläche und mit ausreichender Touchfläche.

Diese Semantik bleibt zukunftssicher: Eine spätere Pagination darf „alle sichtbaren“ nicht in „alle Datenbankzeilen“ umdeuten. Eine seitenübergreifende Auswahl benötigt einen eigenen expliziten Vertrag.

## Umsetzung

### A. Core – umgesetzt

- UUID-Liste normalisieren und validieren.
- Duplikate entfernen und Maximalzahl begrenzen.
- leere, vollständig ungültige und teilweise ungültige Auswahl kontrolliert behandeln.
- reine Selection-Helper für sichtbare IDs, Auswahlzahl und Filterwechsel testen.

### B. Repository – umgesetzt

- `deleteSelectedNotificationsForUser(db, recipientUserId, ids)` ergänzen.
- gleichzeitig auf `.in("id", ids)` und `.eq("recipient_user_id", recipientUserId)` filtern.
- keine Client-User-ID und keine ungebundene Delete-Abfrage zulassen.

### C. Service und Action – umgesetzt

- Die Action normalisiert und begrenzt IDs nach erfolgreicher Authentifizierung und ruft den Service nur bei gültiger nichtleerer Auswahl auf.
- Action verwendet den bestehenden `getContext()`-Pfad und leitet `auth.userId` serverseitig ab.
- Rückgabe bleibt sanitisiert und verrät weder fremde IDs noch rohe Datenbankfehler.
- `/admin/notifications` nur nach erfolgreicher Mutation revalidieren.

### D. UI – umgesetzt

- Selection-State im vollständigen Notification Center ergänzen.
- Desktop- und Mobile-Checkboxen, Auswahlzahl, „Alle auswählen“, „Alle abwählen“ und bestätigtes Sammellöschen ergänzen.
- Auswahl nach Erfolg zurücksetzen; bei Fehler erhalten und verständliches Feedback anzeigen.
- Detailauswahl und Routerverhalten beim Löschen der geöffneten Notification kontrolliert behandeln.
- Glocke unverändert lassen.

### E. Tests – umgesetzt

- einzelne und mehrere IDs, Duplikate, leere und ungültige Listen, Batchlimit.
- fremde ID sowie gemischte eigene/fremde IDs ohne Existenzleck.
- zwingender serverseitiger User-Kontext, Repository-Userfilter und bestehende RLS-Grenze.
- alle aktuell sichtbaren auswählen, abwählen, Filterwechsel und Auswahlzahl.
- Bestätigung, erfolgreicher Reset und Fehlerzustand.
- Desktop- und Mobile-Struktur ohne horizontales Scrollen.
- Required Read/Unread-, Detail-, Einzellösch- und `deleteAllRead`-Regression.
- statischer Nachweis des bestehenden Delivery-Cascade-Verhaltens und der unabhängigen Audit-Tabelle.
- vollständige Notification-, Preference-, Delivery-, Monitoring- und Navigationstests sowie ESLint, Build und `git diff --check`.

## Freigabeentscheidung

Die bestehende Cascade-Semantik ist für D11 freigegeben und unverändert beibehalten: Das Löschen einer persönlichen Notification löscht auch deren operative Delivery-Ledgerzeile. `notification_audit` bleibt unabhängig bestehen. Eine künftig gewünschte dauerhafte Delivery-Historie unabhängig von der persönlichen Inbox bleibt ein eigener Datenmodell-/SQL-Block.
