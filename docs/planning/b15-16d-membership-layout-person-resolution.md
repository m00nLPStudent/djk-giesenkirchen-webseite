# B15.16D – Membership-Layout und Personenauflösung

## 1. Ziel

Die Membership-Liste nutzt ohne Auswahl die volle Breite. Details erscheinen erst nach einer Auswahl. Zielpersonen und gespeicherte Weiterleitungen verwenden eine belastbare Namensauflösung.

## 2. Ausgangslage

Das bisherige Layout reservierte stets eine 35/65-Aufteilung. Außerdem erwartete der Membership-Mapper Snake-Case-Namensfelder, obwohl der Coach-Read-DTO normalisierte Camel-Case-Felder liefert.

## 3. Listenlayout

Ohne Auswahl wird ausschließlich die vollständige Desktoptabelle beziehungsweise mobile Kartenliste gerendert. Die fünf Spalten besitzen getrennte Grid-Bereiche. Der Weiterleitungsstatus ist eine kleine Sekundärzeile unter dem Hauptstatus.

## 4. Detail-Rendering

Erst eine explizite Auswahl aktiviert die responsive 35/65-Aufteilung und rendert die Detailansicht. Auf kleineren Viewports folgt das Detail unterhalb der Kartenliste.

## 5. Root Cause „Unbekannte Person“

`createCoachReadDto` liefert `displayName`, `firstName`, `lastName`, `teamNames` und normalisierte Rollen. Der bisherige Membership-Mapper las dagegen nur `first_name`, `last_name` und `name`. Dadurch ging der bereits korrekt normalisierte Trainername verloren.

## 6. Personenresolver

`resolvePersonDisplayName` bündelt die Reihenfolge `displayName`, `display_name`, `fullName`, `full_name`, Vor-/Nachname und `name`. Nur vollständig namenlose Datensätze erhalten den neutralen Fallback.

## 7. Trainer-Mapping

Das Zielpersonenmodell nutzt ausschließlich bereits geladene Coach-DTO-Werte: ID, Anzeigename, Bild, Rollen-Summary, Mannschaftsliste, E-Mail, Aktivstatus und Zieltyp. Mehrere Rollen und Mannschaften bleiben erhalten.

## 8. Vorstands-Mapping

Vorstandsmitglieder verwenden denselben Resolver. Funktion, vorhandener Bereich, E-Mail und Aktivstatus werden ausschließlich aus dem bestehenden Loader-Ergebnis übernommen.

## 9. Zielpersonenkarten

Die Radio-Karten zeigen Avatar, vollständigen Namen, Funktion, Mannschaften, optionale E-Mail und Aktivstatus. Texte brechen kontrolliert um; die gesamte semantische Label-Fläche ist auswählbar.

## 10. Gespeicherte Weiterleitung

Aktuell aufgelöste Personen werden bevorzugt. Danach folgen gespeicherter Name, gespeicherte E-Mail und schließlich „Zielperson nicht mehr verfügbar“. Historische Daten werden nicht verändert.

## 11. Fallbacks für Altdaten

Teilweise vorhandene historische Weiterleitungen bleiben darstellbar. Es gibt weder Backfill noch automatische Datenkorrektur.

## 12. Statusdarstellung

Der Hauptstatus verwendet `AdminStatusChip`. „Weitergeleitet“ erscheint kompakt darunter, während der Chevron eine eigene Spalte behält.

## 13. Responsive

Desktop startet mit 100 Prozent Listenbreite. Nach Auswahl gilt 35/65. Tablet und Mobil stapeln Liste und Detail ohne feste Pixelbreiten oder horizontale Scrollcontainer.

## 14. Accessibility

Listenzeilen bleiben semantische Buttons. Zielpersonen sind Radio-Inputs innerhalb vollständig anklickbarer Labels. Fokuszustände und textuelle Statusangaben bleiben sichtbar.

## 15. Tests

Tests decken Resolver-Fallbacks, Coach- und Board-Mapping, Mehrfachrollen/-teams, bedingtes Detail-Rendering, Listenbreite, Auswahlmarkierung, Weiterleitungsfallbacks und Abstände ab.

## 16. Risiken

Historische Weiterleitungen können nur Felder anzeigen, die bereits im Datensatz gespeichert sind. Eine visuelle Prüfung mit realen langen Namen und E-Mail-Adressen bleibt sinnvoll.

## 17. Empfohlener nächster Schritt

Manueller Regressionstest mit echten Trainer-, Vorstands- und historischen Weiterleitungsdatensätzen an den Ziel-Viewports.
