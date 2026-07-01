# Admin Architektur

## Ziel

Der Adminbereich soll modular aufgebaut sein und langfristig alle Vereinsinhalte pflegbar machen.

## Bestehende Hauptmodule

- Dashboard
- News
- Mannschaften
- Spieler
- Trainer und Betreuer
- Saisonverwaltung

## Geplante Hauptmodule

- Einstellungen
- Benutzerverwaltung
- Medienverwaltung
- Termine
- Sponsoren
- Galerie
- Downloads
- Vorstand

## Gemeinsame Admin-Bausteine

- FormFields
- Tab-Navigation
- Status-Badges
- Statistik-Karten
- Entity Cards
- Upload-Komponenten
- Löschdialog
- Telefonnummern-Helfer

## Löschmodul

Zentrale Kette:

```text
AdminRemoveButton
→ removeActions.js
→ Supabase RPC remove_entity()
→ PostgreSQL
```

## Regel

Neue Adminmodule sollen immer zuerst prüfen, welche bestehenden Komponenten wiederverwendet werden können.
