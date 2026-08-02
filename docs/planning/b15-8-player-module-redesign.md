# B15.8 – Migration des Spieler-Moduls

## 1. Ziel

Das vollständige Admin-Spielermodul verwendet die in B15.7 eingeführten Präsentationsbausteine. Datenzugriff, Fachlogik, Permissions, Scopes, Archivierung und Formulare bleiben funktional unverändert.

## 2. Ausgangslage

Die Übersicht besaß einen eigenen Header, eine separate Such-/Filterfläche, große Statistiksegmente, eigene Desktop- und Mobile-Listen sowie keinen robusten gemeinsamen Avatar. Die Detailansicht bündelte Header und Beitragsdarstellung in modulspezifischem Markup.

## 3. Verwendete Design-System-Komponenten

Verwendet werden `AdminModulePage`, `AdminModuleHeader`, `AdminModuleSearch`, `AdminModulePrimaryAction`, `AdminModuleFilters`, `AdminModuleSummary`, `AdminMetric`, `AdminModuleList`, `AdminModuleCards`, `AdminListHeader`, `AdminListRow`, `AdminListMobileCard`, `AdminListChevron`, `AdminModuleEmptyState`, `AdminDetailLayout`, `AdminDetailHeader`, `AdminInformationSection`, `AdminInformationRow`, `AdminActionBar`, `AdminButton`, `AdminDangerZone` und `AdminBackLink`.

## 4. Übersichtsseite

`AdminPlayersOverview` hält ausschließlich den lokalen Suchwert zusammen mit Header, Summary und Liste. Der Server liefert weiterhin denselben bereits gescopten und fachlich aufbereiteten Datensatz.

## 5. Summary

Gesamtspieler, inaktive Spieler, Nationalitäten und offene Beitragsfälle erscheinen als kompakte Metrics. Die vorhandenen klickbaren Nationalitäten- und Beitragsfilter behalten ihre URL-Logik.

## 6. Filter

`AdminModuleFilters` ist standardmäßig geschlossen. Der bestehende Filterdialog, seine Felder, Draft-Zustände und die URL-Synchronisierung wurden unverändert übernommen. Die aktive Filteranzahl erscheint als Badge.

## 7. Desktopliste

Ab `xl` zeigt die gemeinsame Liste Profilbild, Name, Mannschaft, Aktivstatus sowie – bei bestehender Sichtbarkeit – Beitragsstatus und offenen Betrag. Das breite fachliche Spaltenset bleibt dadurch ungequetscht.

## 8. Mobile-Karten

Unterhalb `xl` wird der gesamte Datensatz als klickbare Karte dargestellt. Es gibt keine verschachtelten Aktionen. Avatar, Name, Mannschaft, Status, Beitrag, offener Betrag und Chevron bleiben erreichbar.

## 9. Spielerbild

`PlayerAvatar` verwendet `resolvePlayerImageUrl()` und den normalisierten DTO-Wert `imageUrl`. Fehlende Werte nutzen das Standardbild; ein Ladefehler wechselt ohne weitere Bildanforderung auf einen Initialen-Platzhalter.

## 10. Detailseite

Der gemeinsame Detailheader enthält Zurücklink, 64-Pixel-Avatar, Name, Aktivstatus, Mannschaft/Saison und die berechtigungsabhängigen Fachaktionen „Beitrag öffnen“ und „Bearbeiten“. Read-only-Nutzer erhalten keinen leeren Aktionscontainer. Archivieren ist ausschließlich im Gefahrenbereich möglich.

## 11. Beitragsbereich

Status und Geldwerte werden weiterhin ausschließlich vom bestehenden Contribution-DTO geliefert. Die Darstellung nutzt Summary-Metrics und einen gemeinsamen Statuschip. Der Zustand ohne Beitrag verwendet den gemeinsamen Empty State.

## 12. Informationssektionen

Vorhandene DTO-Werte für persönliche Daten, Mannschaft, Saison, Position, Rückennummer, Status, Notizen und Historie werden als einheitliche Label-/Wert-Zeilen ausgegeben. Fehlende Werte erscheinen als Gedankenstrich.

## 13. Gefahrenbereich

Die vorhandene `ArchiveButton`-Action und Vorschau bleiben unverändert. Der gemeinsame Gefahrenbereich erklärt weiterhin Inaktivsetzung, Ende aktiver Zuordnungen und Erhalt der Beitragsdaten.

## 14. Formulare

Create und Edit verwenden gemeinsame Seiten-, Header- und Zurücklink-Hüllen. Felder, Tabs, Validierung, Submit, Upload, Teamwechsel und Rollback wurden nicht verändert.

## 15. Accessibility

Links und Buttons bleiben semantisch, Karten und Zeilen sind vollständig fokussierbar, Disclosure und Dialog behalten ARIA-Zustände, Bilder besitzen Alttexte und Platzhalter eine zugängliche Beschriftung. Touchziele sind mindestens 44 Pixel hoch.

## 16. Responsive

Header, Aktionen und Informationszeilen stapeln mobil. Karten gelten bis 1180 Pixel einschließlich; die siebenspaltige Tabelle erscheint ab `xl`. Feste Avatare und `minmax`-Spalten vermeiden Layoutsprünge und horizontale Scrollleisten.

## 17. Tests

UI-Strukturtests decken Übersicht, Summary, Filter, Listenvarianten, Avatar, Detail, Contribution-Zustände sowie Create/Edit-Hüllen ab. Bestehende DTO-, Read-Model-, Scope-, Archivierungs-, Formular-, Navigations- und Dashboardtests bleiben unverändert.

## 18. Risiken

Ein manueller Real-Daten-Test benötigt eine authentifizierte Adminsitzung. Die bestehende Filterbedienung öffnet innerhalb des gemeinsamen Disclosures weiterhin den bewährten Dialog; eine Inline-Umstellung wäre eine gesonderte UX-Änderung.

## 19. Empfohlener nächster Schritt

Nach visueller Abnahme des Spielermoduls sollte gemäß B15.7-Migrationsplan das Mannschaftsmodul auf dieselben Listen-, Detail- und Statusprimitives umgestellt werden.
