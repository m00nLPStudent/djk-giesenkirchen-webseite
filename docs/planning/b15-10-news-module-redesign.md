# B15.10 – Redesign des Admin-News-Moduls

## Ziel

Das News-Modul verwendet das gemeinsame Admin-Designsystem für Übersicht, responsive Liste, Leerzustand, Erstellung und die kombinierte Detail-/Arbeitsseite. Datenzugriff, Veröffentlichungs-, Upload- und Löschlogik bleiben unverändert.

## Übersicht

Der gemeinsame Modulheader enthält Titel, Beschreibung, berechtigungsgeschützte Primäraktion und die direkt integrierte Suche. Die bestehenden Werte Gesamt, Entwürfe, Veröffentlicht und Geplant werden als kompakte `AdminMetric`-Zusammenfassung dargestellt; es wurden keine neuen Statuswerte berechnet.

## Filter

Die vorhandenen lokalen Statusfilter Alle, Veröffentlicht, Geplant und Entwürfe befinden sich im standardmäßig eingeklappten `AdminModuleFilters`. Da vorher keine URL-Synchronisation existierte, wurde keine neue URL- oder Routinglogik eingeführt.

## Liste

Ab `xl` zeigt die Tabelle Titel, Kategorie, Status, Autor, Veröffentlichungsdatum und Übersicht. Darunter erscheinen kompakte Karten mit Titel, Kategorie, Status, Datum und Chevron. Bearbeitungslinks bleiben über `news.edit` geschützt; ohne Berechtigung sind Einträge rein informativ und nicht klickbar.

## Detail- und Arbeitsseite

Die bestehende kanonische Route `/admin/news/edit/[id]` bleibt erhalten und dient weiterhin als Detail- und Arbeitsseite. Ihr Header zeigt Zurück, Titel, Status, Metadaten und Bearbeiten. Darunter folgen Informationsbereiche für Inhalt, SEO-nahe Bestandsfelder, Bilder/Dokumente und Historie sowie der unveränderte Editor.

## Gefahrenbereich

Die Löschaktion wurde aus der Übersicht entfernt und erscheint ausschließlich am unteren Ende der Detailseite im `AdminDangerZone`. Die bestehende Delete-Action und Bestätigungslogik wurden nicht verändert.

## Erstellung und Editor

Die Erstellungsseite verwendet `AdminDetailLayout` und `AdminDetailHeader`. Die Editor-Tabs verwenden gemeinsame Panels und Buttons. Bild-, Dokument-, Veröffentlichungs- und Speicherhandler bleiben identisch verdrahtet.

## Responsive und Accessibility

Die Tabelle wird ausschließlich ab `xl` gerendert; darunter werden Karten verwendet. Es gibt keinen horizontalen Scrollcontainer. Links, Suchfeld, Filter-Accordion, Fokuszustände und Touchziele stammen aus den gemeinsamen Design-System-Komponenten.

## Tests und Risiken

Quellbasierte UI-Regressionen sichern Query-Anker, bestehende Statusberechnung, Header-Suche, Filter, Breakpoints, Leerzustand, Detailstruktur, Gefahrenbereich und Editor-Handler. Da keine separate Read-only-Detailroute existiert, bleiben nicht bearbeitungsberechtigte Einträge bewusst nicht klickbar.
