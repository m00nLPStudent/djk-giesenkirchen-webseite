# Teams Modul

Dokumentation des Teams/Mannschaften-Moduls.

## Quellen

- [Football Modul (Legacy)](football.md)
- [Seasons Modul (Legacy)](seasons.md)
- [Department Modul (Legacy)](department.md)

## Status

- Teamdaten sind in Admin und Website integriert.
- Saisonstruktur ist vorbereitet und wird schrittweise ausgebaut.
- Trainingszeiten werden zusätzlich strukturiert über eigene Tabellen verwaltet.

## Team-Trainingszeiten

Neben den Legacy-Feldern `training_times_de` und `training_times_en` gibt es jetzt eine strukturierte Verwaltung für Mannschaftstrainings.

Betroffene Tabellen:

- `team_training_times`
- `team_training_exceptions`
- `club_closure_periods`

Die Legacy-Felder bleiben vorerst bestehen und werden **nicht** entfernt.

## Admin-Verwaltung

Im Mannschaftsformular gibt es einen Reiter `Trainingszeiten`.

Dort können gepflegt werden:

- reguläre Trainingszeiten pro Team-Saison
- mehrere Wochentage beim Anlegen einer neuen Trainingszeit
- Ausnahmen für Ausfall oder Verlegung

Pflegbare Trainingszeit-Felder:

- Wochentag
- Beginn / Ende
- Trainingsart
- Sportanlage
- Straße
- Ort
- Aktiv / Inaktiv
- Gültig von / bis
- Bemerkung

Pflegbare Ausnahme-Felder:

- Datum
- Typ (`fällt aus`, `verlegt`)
- optionale neue Uhrzeit
- optionaler neuer Ort
- optionale neue Trainingsart
- Bemerkung

## Öffentliche Nutzung

- Die Trainingszeiten erzeugen keine echten Event-Datensätze.
- Stattdessen werden daraus virtuelle Trainings zur Laufzeit berechnet.
- Virtuelle Trainings können auf die öffentliche Mannschaftsseite verlinken, wenn ein Team-Slug verfügbar ist.

## Bekannte offene Punkte

- keine öffentliche Bearbeitung oder Anzeige historischer Trainingstabellen außerhalb der Termine-Ansichten
- keine Admin-Oberfläche für `club_closure_periods` im aktuellen Stand
- Legacy-Felder und strukturierte Trainingslogik laufen parallel, bis eine spätere Bereinigung freigegeben wird
