# Modul: Abteilung

## Status

Abgeschlossen.

## Ziel

Das Modul bildet die Fußballabteilung öffentlich und im Adminbereich ab. Es trennt Vorstand und Trainerteam klar voneinander.

## Öffentliche Seiten

- `/fussball/abteilung` – Auswahlseite
- `/fussball/abteilung/vorstand` – Vorstandsmitglieder
- `/fussball/abteilung/trainer` – Trainer und Betreuer

## Öffentliche Darstellung

### Vorstand

- Profilbild
- Name
- Funktion
- Telefon als Icon-Link
- E-Mail als Icon-Link

### Trainer und Betreuer

- Profilbild
- Funktion
- Name
- Mannschaftszugehörigkeit als Badge im Bild
- Lizenz als Text
- Telefon als Icon-Link
- E-Mail als Icon-Link

## Adminbereich

Pfad: `/admin/department`

Funktionen:

- Vorstandsmitglieder anzeigen
- Vorstandsmitglied erstellen
- Vorstandsmitglied bearbeiten
- Vorstandsmitglied löschen
- Funktion aus Datenbank-Dropdown auswählen
- englische Übersetzung der Funktion automatisch übernehmen

## Datenbank

### board_members

Speichert die Personen des Vorstands.

Wichtige Felder:

- `first_name`
- `last_name`
- `role_id`
- `role_de`
- `role_en`
- `email`
- `phone`
- `image_url`
- `is_active`
- `sort_order`

### board_roles

Speichert die auswählbaren Vorstandsfunktionen.

Wichtige Felder:

- `name_de`
- `name_en`
- `slug`
- `is_active`
- `sort_order`

## Löschlogik

Vorstandsmitglieder werden über das zentrale Löschmodul gelöscht:

```text
AdminRemoveButton
→ removeActions.js
→ remove_entity('board_member')
```

Es wird nur die Person gelöscht. Andere Inhalte bleiben erhalten.

## Wiederverwendbare Komponenten

- `DepartmentPageLayout`
- `DepartmentPersonCard`
- `DepartmentPersonGrid`
- `department.helpers.js`

## Hinweise

Die Funktion/Rolle ist relational über `board_roles` angebunden. Dadurch können Funktionen später über Einstellungen oder ein eigenes Rollenmodul gepflegt werden, ohne Code zu ändern.
