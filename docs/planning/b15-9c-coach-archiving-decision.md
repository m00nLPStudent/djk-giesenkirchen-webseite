# B15.9C – Entscheidung zur Trainerarchivierung

> Durch B15.9D überholt: Die dort empfohlene sichere Trainerarchivierung ist inzwischen umgesetzt. Der folgende Text dokumentiert den damaligen Ausgangszustand.

## Ist-Zustand

Eine echte Trainerarchivierung existiert nicht. `removeCoachWithScopeAction` prüft `coaches.delete` und `canDeleteCoachOnServer`, ruft danach jedoch die bestehende RPC `remove_entity` mit `entity_type: "coach"` auf. Die Oberfläche bezeichnet dies deshalb weiterhin fachlich korrekt als dauerhaftes Löschen.

## Aktuelle Auswirkungen

Die Oberfläche weist auf das Entfernen des Trainerprofils und seiner Saisonzuordnungen hin. Mannschaften, Spieler und News werden als erhalten benannt. Die tatsächliche Datenbankimplementierung der RPC wurde in B15.9C weder verändert noch neu interpretiert.

## Empfohlene spätere Archivierungsregel

- Coach-Master auf inaktiv setzen
- aktive aktuelle `coach_team_seasons` beenden
- historische Zuordnungen erhalten
- Mannschaften und Spieler unverändert lassen
- keine Beiträge berühren
- öffentliche Trainerseiten revalidieren
- bei Reaktivierung keine Zuordnung automatisch wiederherstellen

## Permission, Revalidation und Risiken

Die bestehende Permission `coaches.delete` kann nur nach fachlicher Entscheidung weiterverwendet werden; B15.9C führt keinen neuen Key ein. Erforderlich wären mindestens Revalidierungen für `/admin/coaches`, `/fussball/abteilung/trainer`, `/trainer/[slug]` und `/fussball/[slug]`. Risiken bestehen bei Legacy-Teamfeldern, mehreren aktiven Saisonzuordnungen und der Abgrenzung zwischen Deaktivierung und datenschutzrechtlicher Löschung.

## Empfehlung

Die sichere Archivierung als separaten Schritt B15.9D mit Service-, Action-, Transaktions- und Regressionstestkonzept umsetzen. Bis dahin bleibt der vorhandene Hard Delete unverändert und eindeutig bezeichnet.
