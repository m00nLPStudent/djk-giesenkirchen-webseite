# B15.9C – Mannschaftstrainerliste und Trainerdetail

## 1. Ziel

Die Mannschaftsdetailseite zeigt aktive Trainerzuordnungen als responsive Personenliste. Die bestehende Trainer-Arbeitsseite verwendet denselben gegliederten Detailstandard wie Spieler und Mannschaften.

## 2. Ausgangslage

Die Teamseite ermittelte über eine Head-Count-Abfrage ausschließlich die Zahl aktiver `coach_team_seasons`. Personendaten wurden nicht geladen. Die Trainer-Arbeitsseite fasste mehrere Informationsarten in einzelnen Textzeilen zusammen.

## 3. Bisherige Traineranzahl

Der bisherige Zähler entstand aus `select("id", { count: "exact", head: true })`. Er wurde durch die Länge derselben Ergebnismenge ersetzt, aus der nun die Liste entsteht.

## 4. Neue Read-Model-Erweiterung

`loadActiveTeamSeasonCoaches` lädt aktive Zuordnungen genau für die dargestellte Team-Saison und anschließend alle aktiven Coach-Stammsätze über eine gemeinsame `in`-Abfrage. Es gibt keine N+1-Abfragen.

## 5. Coach-DTO

Das kompakte DTO enthält ausschließlich ID, Slug, Anzeigename, normalisierte Bild-URL, Assignment-Funktion, Aktivstatus, Lizenz, Team, Saison und einen optionalen sicheren Detaillink. Kontakte, Notizen und interne Assignment-IDs werden nicht weitergegeben.

## 6. Mannschafts-Trainerliste

Desktop zeigt Profil, Name, Funktion, Lizenz, Status und Übersicht. Funktion und Status stammen aus der aktiven saisonalen Zuordnung; `CoachAvatar` verwendet den vorhandenen Bildresolver.

## 7. Mobile-Karten

Unterhalb `xl` erscheinen vollständig klickbare Karten mit Avatar, Name, Funktion, Lizenz, Status und Chevron. Ohne Detailberechtigung wird dieselbe Information nicht klickbar und ohne Chevron dargestellt.

## 8. Trainerdetailseite

Der bestehende `CoachDetailOverview` nutzt weiterhin `AdminDetailLayout` und `AdminDetailHeader`, nun mit Back-Link, 64-Pixel-Avatar, Status, kompakten Zuordnungschips und ausschließlich der Arbeitsaktion Bearbeiten.

## 9. Persönliche Daten

Vorname, Nachname, Anzeigename, Nationalität, vorhandenes Geburts- und Eintrittsdatum sowie Aktivstatus werden einzeln dargestellt.

## 10. Kontakte

E-Mail, Telefon und weiteres Telefon erhalten jeweils eine eigene Zeile. Da die kanonische Route bereits `coaches.edit` und den Coach-Scope verlangt, werden diese Werte nur in diesem geschützten Arbeitskontext angezeigt.

## 11. Mannschaftszuordnungen

Jede aktuell geladene saisonale Zuordnung erhält eine eigene Zeile mit Mannschaft, Funktion, Saison und Aktivstatus. Historische Zuordnungen werden nicht zusätzlich abgefragt.

## 12. Funktionen

Die Funktion stammt aus `coach_team_seasons.role_de` beziehungsweise `role_en` und wird über das bestehende Rollen-Summary normalisiert.

## 13. Lizenzen

Die vorhandene Lizenz wird separat angezeigt; fehlt sie, erscheint „Keine Lizenz hinterlegt“.

## 14. Notizen

Notizen werden nur auf der bereits durch `coaches.edit` und Scope geschützten Trainer-Arbeitsseite und nur bei vorhandenem Inhalt angezeigt.

## 15. Historie

Nur vorhandene Werte für Vereinsbeitritt, Erstellung und Änderung werden dargestellt. Es wurde keine History- oder Audit-Abfrage ergänzt.

## 16. Beitragsbereich

Trainer erhalten keinen Vereinsbeitragsbereich.

## 17. Gefahrenbereich

Die vorhandene Löschaktion bleibt ausschließlich im `AdminDangerZone`. Im Header befindet sich keine Gefahrenaktion.

## 18. Archivierungsstatus

Zum Abschluss von B15.9C existierte noch keine echte Trainerarchivierung. Dieser Zustand wurde durch B15.9D abgelöst.

## 19. Permission und Scope

Die Teamliste erzeugt einen Detaillink nur bei `coaches.edit` und erfolgreichem `canEditCoachOnServer` für den einzelnen Coach. Dadurch entstehen keine Links auf bekannte 403-Ziele.

## 20. Accessibility

Links besitzen zugängliche Namen, Karten sind echte Links, nicht klickbare Varianten echte Container. Avatare behalten Alttexte und Fehlerfallback; Statuswerte bleiben ausgeschrieben.

## 21. Responsive

Ab `xl` wird die Tabelle gezeigt, darunter Karten. Inhalte dürfen umbrechen; es wird keine feste Außenbreite erzeugt.

## 22. Tests

DTO-Sicherheit, Batch-Read, aktuelle aktive Saison, UI-Primitives, Leerzustand, Detailgliederung und korrekte Hard-Delete-Bezeichnung werden fokussiert geprüft. Bestehende Coach-, Team-, Resolver- und Design-System-Tests werden als Regression ausgeführt.

## 23. Risiken

Eine eigenständige Read-only-Trainerdetailroute existiert nicht. Nutzer mit `coaches.view`, aber ohne `coaches.edit`, sehen deshalb bewusst keine Detaillinks.

## 24. Empfohlener nächster Schritt

B15.9D sollte eine fachlich sichere Trainerarchivierung spezifizieren. Eine separate Read-only-Detailroute wäre ein eigener Permission-/Routing-Auftrag.
