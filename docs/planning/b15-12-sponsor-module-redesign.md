# B15.12 – Redesign des Admin-Sponsorenmoduls

## 1. Ziel

Das Admin-Sponsorenmodul verwendet das gemeinsame Designsystem. Datenzugriff, DTO-Fachlogik, Upload, Speicherung, Löschung, Routing, Permissions, Scopes und öffentliche Darstellung bleiben unverändert.

## 2. Ausgangslage

Die Übersicht bestand aus großen Legacy-`EntityCard`-Karten. Suche, Summary und Filter fehlten. Löschen war direkt in jeder Übersichtskarte möglich. Neu- und Bearbeitungsseite verwendeten ausschließlich das Formular ohne gemeinsamen Detailheader.

## 3. Datenfelder und Status

Vorhanden sind `category_id`, `name`, `description_de`, `description_en`, `image_url`, `website_url`, `facebook_url`, `instagram_url`, `tiktok_url`, `is_active` und `sort_order`; Zeitstempel werden nur angezeigt, wenn sie im bestehenden Datensatz vorhanden sind. Kategorien liefern `name_de`, Aktivität und Sortierung. Es gibt genau Aktiv/Inaktiv, keine Planung, Veröffentlichung oder Archivierung. Ein einzelnes Logo/Banner wird unterstützt. Die bestehende Gefahraktion ist Hard Delete.

## 4. Verwendete Design-System-Komponenten

Verwendet werden `AdminModulePage`, `AdminModuleHeader`, `AdminModuleSearch`, `AdminButton`, `AdminModuleFilters`, `AdminModuleSummary`, `AdminMetric`, `AdminModuleList`, `AdminModuleCards`, `AdminListHeader`, `AdminListRow`, `AdminListMobileCard`, `AdminListChevron`, `AdminModuleEmptyState`, `AdminStatusChip`, `AdminDetailLayout`, `AdminDetailHeader`, `AdminActionBar`, `AdminInformationSection`, `AdminInformationRow`, `AdminImagePreview` und `AdminDangerZone`.

## 5. Übersichtsseite

Der Header enthält Titel, Beschreibung, Suche und berechtigungsgeschützte Primäraktion. Die bestehende Sortierreihenfolge aus der Query bleibt erhalten.

## 6. Summary

Die kompakte Summary zeigt Gesamt, Aktiv, Inaktiv und Ohne Logo. Alle Werte werden ausschließlich aus bereits geladenen Feldern abgeleitet.

## 7. Filter

Der Aktivstatusfilter verwendet das standardmäßig geschlossene `AdminModuleFilters`. Suche und Filter sind lokaler UI-Zustand; URL- oder Querylogik wurde nicht ergänzt.

## 8. Desktopliste

Ab `xl` erscheinen Logo, Name, Kategorie, Status, Website und Übersicht. Es gibt keinen horizontalen Scrollcontainer.

## 9. Mobile-Karten

Unter `xl` erscheinen vollständig klickbare Karten. Die Website wird deshalb nur als Vorhanden/Nicht vorhanden angezeigt; ein verschachtelter Link wird vermieden.

## 10. Sponsorlogo

`SponsorLogo` zeigt vorhandene URLs mit festen Abmessungen und `object-contain`. Leere oder fehlerhafte URLs wechseln lokal auf eine neutrale Initiale und erzeugen weder leeres `src` noch eine Fehlerschleife.

## 11. Detail-/Bearbeitungsseite

Mangels separater Read-only-Route bleibt `/admin/sponsors/edit/[id]` die kombinierte Arbeitsseite. Der Header enthält Logo, Name, Aktivstatus, Kategorie, Website-Metadatum sowie Bearbeiten und optional Website öffnen.

## 12. Informationsbereiche

Sponsor, Kategorie, Aktivstatus, Sortierung, bestehende Links, deutsche und englische Beschreibung, Logo sowie vorhandene Zeitstempel werden semantisch dargestellt. Fehlende Werte rendert das Designsystem einheitlich.

## 13. Website-Link

Nur explizite HTTP(S)-URLs werden verlinkt und mit `target="_blank"` sowie `rel="noopener noreferrer"` geöffnet. Andere oder ungültige Werte bleiben ungeklickt.

## 14. Bildvorschau

Die bestehende Uploadkomponente und Storage-Logik bleiben erhalten. Die Formularvorschau wird per Sponsor-Wrapper proportional dargestellt; die Detailansicht nutzt die vorhandene `AdminImagePreview`.

## 15. Sortierung

`sort_order` bleibt im Formular und in der bestehenden Query unverändert. Drag-and-drop wurde nicht ergänzt.

## 16. Gefahrenbereich

Das bestehende Hard Delete wurde aus der Übersicht entfernt und erscheint ausschließlich unten als „Sponsor dauerhaft löschen“. Es wird nicht als Archivierung bezeichnet.

## 17. Accessibility

Designsystem-Links liefern Fokuszustände und Touchziele. Filter nutzt Disclosure-ARIA. Logos besitzen Alttext beziehungsweise einen beschrifteten Fallback. Mobile Karten enthalten keine verschachtelten Links.

## 18. Responsive

Desktoptabelle und Mobile-Karten wechseln bei `xl`. Namen und URLs werden kontrolliert gekürzt beziehungsweise umgebrochen; Logos bleiben proportional. Es existiert kein horizontaler Scrollcontainer.

## 19. Tests

Core- und UI-Regressionen prüfen Summary, Suche, Filter, Status, sichere URLs, responsive Listen, Logo-Fallback, Detailstruktur, Gefahrbereich und unveränderte fachliche Anker.

## 20. Risiken

Die bestehende generische Uploadvorschau besitzt selbst keinen lokalen Bildfehler-Fallback; in Liste und Detailheader ist dieser vollständig vorhanden. Zeitstempel werden nur angezeigt, wenn die bestehende Query sie liefert. Eine visuelle Browserprüfung benötigt eine authentifizierte Testsession.

## 21. Empfohlener nächster Schritt

B15.13 kann die Vereinsgeschichte auf gemeinsame Medienlisten, Header und Empty States migrieren, ohne deren Medien- oder Veröffentlichungslogik zu verändern.
