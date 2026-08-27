# Modul: Admin Framework

## Ziel

Das Admin Framework stellt wiederverwendbare Grundlagen für alle Adminmodule bereit.

## Bestandteile

- AdminLayout
- FormSection
- FormGrid
- FormActions
- FormFields
- TabNavigation
- EntityCard
- EntityBadge
- StatisticGrid
- AdminRemoveButton
- AdminToolbar
- AdminSaveBar
- AdminEmptyState
- AdminSelectionList

## Löschlogik

Alle Löschvorgänge sollen über dieselbe Kette laufen:

```text
AdminRemoveButton
→ removeActions.js
→ remove_entity()
```

## Regel

Neue Adminmodule sollen diese Bausteine nutzen, bevor neue Komponenten erstellt werden.

## Fachliche Adminnavigation

Desktop- und Mobilnavigation werden aus derselben zentralen, serverseitig nach Permissions und Scopes gefilterten Navigation abgeleitet. Die sichtbaren aktiven Bereiche sind fachlich gegliedert:

- Gesamtverein: News, Sponsoren, Termine, Vereinsgeschichte, Mitgliedsanfragen, Medien sowie der gemeinsame Einstieg „Seiten, Kontakte & Einstellungen“.
- Fußball: Mannschaften, Spieler, Trainer, Vereinsbeiträge und „Fußballvorstände“ unter der bestehenden URL `/admin/department`.
- System: Benutzer, Rollen, Rechte sowie die ausschließlich für Superadmins sichtbaren Bereiche „E-Mail-Benachrichtigungen“ und Notification Monitoring.

Die Gruppierung verändert weder URLs noch Route Guards, Permissions oder Scopes. Insbesondere bleibt `/admin/department` durch `settings.view` und den bestehenden Board-Scope geschützt und verwaltet fachlich die Vorstände der Fußballabteilung.

Die persönlichen In-App-Benachrichtigungseinstellungen und die globale Superadmin-E-Mail-Steuerung verwenden dieselben kompakten, responsiven Listenbausteine. Persönliche Preferences ändern ausschließlich den In-App-Kanal; globale E-Mail-Typen und Master bleiben davon getrennt.

Das persönliche Notification Center verwendet ebenfalls die responsiven Listenbausteine und ergänzt sie um eine kompakte Auswahlleiste für aktuell sichtbare Zeilen. Mehrfachauswahl, Sammellöschung und deutsche Typfilter wurden auf Desktop und Mobile manuell abgenommen; bestehende Permissions und Own-user-Grenzen bleiben unverändert.

Eine eigenständige „Vereinsstruktur“ für den Gesamtverein wird erst in einem separaten Folgeblock geplant. Voraussetzung dafür sind eine fachlich getrennte Gesamtvereinsroute und eine eindeutig zugeordnete Datenquelle; bis dahin gibt es keinen entsprechenden Navigationseintrag.

## Refactoring-Status

Gemeinsame Admin-Komponenten und Helper wurden eingeführt und in mehrere Module integriert.
