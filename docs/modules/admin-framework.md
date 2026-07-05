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

## Refactoring-Status

Gemeinsame Admin-Komponenten und Helper wurden eingeführt und in mehrere Module integriert.
