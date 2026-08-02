# B15.1 – Gesamtanalyse und Zielkonzept für das CMS-Redesign

## 1. Ziel

Das Admin-CMS soll von einer überwiegend fußballzentrierten Seitenleiste zu einer Vereinsplattform mit den Bereichen Gesamtverein, Fußball, Tischtennis, Behindertensport und Gymnastikdamen weiterentwickelt werden. B15.1 beschreibt ausschließlich Zielarchitektur und Migration; Routen, Runtime, Datenbank und UI bleiben unverändert.

## 2. Aktueller Admin-Aufbau

`AdminLayout` bindet `AdminShell` ein. Die Shell stellt `AdminUiContextProvider`, sticky Header, mobile Sidebar, Desktop-Sidebar und einen auf `max-w-7xl` begrenzten Inhaltsbereich bereit. Aktuelle Admin-Routen bestehen für Dashboard, News, Termine, Mannschaften, Spieler, Trainer, Vereinsbeiträge, Sponsoren, Fußball-Abteilung/Vorstand, Vereinsgeschichte, Einstellungen, Benutzer, Rollen, Permissions und Profil. `/admin/media` und `/admin/tournaments` stehen in Navigation und Permission-Map, besitzen aber keine Route. Mitgliedsanfragen, Seiten und Kontakte sind Unteransichten von `/admin/settings`.

## 3. Aktueller Header

Produktiv verwendet wird `AdminHeader`: Marke, mobiler Menüknopf, `AdminSearchBar`, Uhr, Website-Link, Glocke und Profilmenü. Suche und Uhr werden auf kleineren Breakpoints teilweise ausgeblendet. Das Profilmenü lädt Anzeigename, primäre Rolle, Status und E-Mail und enthält Profil/Logout. Die Glocke ist nur ein visueller Platzhalter. Parallel existiert ein zweiter Komponentenstrang `topbar/AdminTopbar` mit `AdminSearch`; vor dem Redesign muss ein kanonischer Strang gewählt und der andere später kontrolliert stillgelegt werden.

Die globale Suche durchsucht News, Teams, Spieler, Trainer, Sponsoren und Vorstand. Sie verwendet derzeit einen importierten Supabase-Client, lädt begrenzte Mengen und filtert lokal. Permission- und Scope-Filter sind im Suchservice nicht erkennbar. Vor Ausbau ist daher eine serverseitige, permission- und scope-sichere Suchschnittstelle erforderlich.

## 4. Aktuelle Sidebar

Gruppen und Einträge:

- Inhalte: Dashboard, News, Termine, Medien.
- Vereinsstruktur: Abteilung, Sponsoren, Mannschaften, Trainer, Spieler, Vereinsbeiträge, Vereinsgeschichte, Turniere.
- System: Benutzer, Rollen, Rechte, Einstellungen.

Die Sichtbarkeit läuft über `filterVisibleAdminUiItems` und Permission-Keys. Das aktive Element wird für Dashboard exakt, sonst per `pathname.startsWith(href)` bestimmt. Mobil wird dieselbe Sidebar in einem aufklappenden, intern scrollenden Bereich verwendet. Risiken beim Entfernen: mobiler Menüstatus sitzt in `AdminShell`; aktive Route, Permissionfilter, Branding/Fußzeile und Layoutbreite sind an die Sidebar gekoppelt; Scope wird auf Navigationsebene nicht ausgewertet; Dropdown-Fokusmanagement existiert noch nicht.

## 5. Gesamtverein

Zielunterpunkte: News (`/admin/news`, `news.view`), Termine (`/admin/events`, `events.view`), Sponsoren (`/admin/sponsors`, `sponsors.view`), Vereinsgeschichte (`/admin/club-history`, `club_history.view`), Vereinsstruktur/Ansprechpartner (`/admin/department`, derzeit `settings.view`), Seiten und allgemeine Kontakte (`/admin/settings`, `settings.view`), Mitgliedsanfragen (`/admin/settings`, fachlich vorhandene `membership_requests.*`), Medien (`/admin/media`, noch ohne Route) und Einstellungen. Dashboard bleibt als eigener Hauptpunkt, weil es rollen- und bereichsübergreifend ist.

Öffentliche Abhängigkeiten bestehen insbesondere zu `/news`, `/termine`, `/fussball/sponsoren`, `/fussball/vereinsgeschichte`, `/kontakt`, `/mitglied-werden`, `/impressum` und `/datenschutz`. Sponsoren und Vereinsgeschichte sind aktuell öffentlich unter Fußball verortet; ihre spätere CMS-Zuordnung zum Gesamtverein ändert nicht automatisch die öffentlichen Routen.

## 6. Fußball

Vorhanden sind Mannschaften, Spieler, Trainer, Vereinsbeiträge und Fußball-Ansprechpartner. B13/B14 verwenden `seasons`, `team_seasons`, `player_team_seasons`, `coach_team_seasons`, bestehende Team-/Youth-Scopes und Contributions-Permissions. Turniere und ein eigenes Spielbetriebsmodul sind nur Navigation/Zielbild, nicht implementiert. Trainingszeiten und Wettbewerbs-/Widgetdaten liegen derzeit in Mannschaftsformularen.

Globale Modulzugriffe für Superadmin sowie Sonderbehandlung von Vorstand/Fußball-Vorstand stehen neben `global`, `youth_all` und `assigned_teams`. Trainer und Betreuer sind teamgebunden. Kassierer besitzt im Contribution-Kern Vollzugriff, Vorstand nur Lesen/Export; Jugendleiter/Trainer erhalten lediglich scoped Contribution-Status in Team-/Spieleransichten. Diese Trennung muss in Navigation und Suche erhalten bleiben.

## 7. Tischtennis

Vorhanden ist nur die öffentliche statische Route `/tischtennis`; Admin-Routen, eigene Permissions, Scopes und nachgewiesene Tischtennis-Teamdaten fehlen. Ziel: Übersicht, Mannschaften, Spieler, Verantwortliche, Turniere, Trainingszeiten, Tabellen, Spielpläne und Medien. Vor Wiederverwendung des Fußballmodells ist zu entscheiden, ob `teams` sportübergreifend modelliert ist, wie Wettkampf-/Tabellenanbieter angebunden werden und ob saisonale Kader fachlich identisch funktionieren. Bis dahin `NEW_LATER`.

## 8. Behindertensport

Eine eigene öffentliche oder administrative Route wurde nicht gefunden. Für Beschreibung, Geschichte, Trainingsort/-zeiten und Kontakt können zunächst `pages`, `club_contacts` und Medien-URLs wiederverwendet werden. Eine generische Galerieverwaltung ist nicht als eigenständiges Modul nachgewiesen. Team-/Player-Modelle sind voraussichtlich nicht erforderlich. Entscheidung nötig: öffentlicher Slug, redaktionelle Zuständigkeit und Medienmodell.

## 9. Gymnastikdamen

Die öffentliche Route `/damen-gymnastik` existiert; ein Adminbereich fehlt. Für Beschreibung, Geschichte, Training und Ansprechpartnerin sind `pages`, `club_contacts` und vorhandene Medienfelder geeignete erste Kandidaten. Eine Galerie und abteilungsbezogene Berechtigungen sind offen. Auch hier ist zunächst kein Team-/Player-Modell erforderlich.

## 10. Neue Navigation

Empfehlung: eigener Hauptpunkt „Übersicht“ plus „Gesamtverein“, „Fußball“, „Tischtennis“, „Behindertensport“, „Gymnastikdamen“. Übersicht ist kein Unterpunkt des Gesamtvereins, da Dashboardinhalte persönlich, bereichsübergreifend und scopeabhängig sind. Jeder Navigationsknoten erhält Route, Permission-Anforderung, optionalen Scope-Resolver, Status und Kinder. Leere Hauptbereiche werden nicht gerendert.

## 11. Desktopnavigation

Unter dem bestehenden Header liegt eine zweite sticky Zeile mit horizontalen Hauptpunkten. „Übersicht“ ist Direktlink; Bereiche öffnen ein zugängliches Mega-Menü mit höchstens zwei kompakten Spalten (Verwalten/Inhalte beziehungsweise Administration). Öffnen per Klick und Tastatur, nicht ausschließlich Hover. `aria-expanded`, `aria-controls`, Escape, Pfeiltasten, Fokus-Rückgabe und Click-outside sind verbindlich. Menüs dürfen nicht in einem Container mit `overflow: hidden` liegen.

## 12. Mobile Navigation

Eindeutige Empfehlung: Menüknopf im Header öffnet einen seitlichen oder vollbreiten Drawer; darin accordionartige Hauptbereiche und normale, mindestens 44 px hohe Links. Nur ein Accordion ist gleichzeitig offen, der aktive Pfad ist initial aufgeklappt, Escape/Backdrop schließen und Fokus bleibt im Drawer. Keine gequetschte horizontale Navigation und keine Desktop-Mega-Menüs auf Mobilgeräten.

## 13. Permission-Modell

Bestehende Modul-Keys (`*.view/create/edit/delete/publish`, Contributions-Spezialkeys, `settings.*`, `membership_requests.*`, `users.*`, `roles.*`, `permissions.*`, `system.view`) bleiben Quelle der Wahrheit. Rollenname darf Navigation nicht freischalten. Später mögliche additive Keys: `media.view/edit`, `tournaments.view/edit`, `departments.view/edit`, sowie fachlich getrennte `table_tennis.*`, `disabled_sports.*` und `gymnastics.*`. Ob generische `department_content.*` besser ist, ist vor SQL zu entscheiden.

Wichtig: `AUTH_ENFORCEMENT_ENABLED` ist aktuell `false`; UI- und Route-Engine lassen dadurch Permissionprüfungen passieren, während einzelne Server-Actions eigene Guards verwenden. Produktiver Enforcement-Status und erwartetes Deployment-Verhalten sind ein Go-/No-Go-Punkt. Die Route `/admin/department` ist in der Sidebar mit `settings.view`, in der zentralen Route-Map jedoch mit `system.view` verknüpft; das muss vor Navigationsextraktion vereinheitlicht werden.

## 14. Scope-Modell

Vorhanden: `global`, `youth_all`, `assigned_teams`, `own_profile`, `own_board_card`, `own_staff_card`, `own_content`, `read_only`, `none`. Teamzuordnungen kommen aus Coach-Saisonrelationen und optional `admin_profile_team_assignments`. Die Navigation prüft derzeit keinen Scope; Scope greift erst in Modulseiten/Actions. Zielkonfiguration benötigt einen serverseitig ermittelten `visibilityResolver`, der einen Hauptpunkt nur zeigt, wenn mindestens ein Kind sowohl Permission als auch erreichbaren Scope hat.

## 15. Department-Struktur

`departments` enthält ID, Namen, Slug, Aktivstatus und Sortierung; `teams.department_id` referenziert Departments. Das reicht zur Klassifikation von Teams nach Abteilung. Es reicht nicht für Zugriffskontrolle: Im Scope-Kontext fehlen `departmentIds`, Department-Zuweisungen zu Adminprofilen und ein generischer Department-Resolver. Für reine Inhaltsabteilungen können `pages` und `club_contacts` genügen. Fußball und Tischtennis benötigen voraussichtlich Team-/Person-Scope; Behindertensport und Gymnastik eher Content-Scope. Vor Datenmodelländerungen ist zu prüfen, ob `admin_profile_team_assignments` plus Content-Ownership genügt oder ein späterer Department-Scope wirklich notwendig ist.

## 16. Neues Dashboard

Zielaufbau: kompakter Begrüßungskopf; eine schmale, permission-gefilterte Hinweisleiste; zweispaltige Arbeitsübersicht aus offenen Aufgaben und anstehenden Terminen; kompakte Schnellnavigation; darunter aktuelle Inhalte und scope-relevante Mannschaften. Contributions erscheinen nur bei bestehender Berechtigung, Mitgliedsanfragen nur mit `membership_requests.view`. Bestehende große Statistik-Kacheln werden später durch verdichtete Kennzahlenzeilen ersetzt. Keine getrennten Scrollcontainer.

## 17. Begrüßungslogik

Testbare pure Funktion mit lokaler Zeitzone: Stunde `< 12` → „Guten Morgen“, `< 18` → „Guten Tag“, sonst „Guten Abend“. Name: `display_name`, sonst sauber extrahierter Vorname aus `full_name`, sonst kein Komma und kein erfundener Name. Grenztests: 11:59, 12:00, 17:59, 18:00 sowie fehlender/leerzeichenbehafteter Name.

## 18. Benachrichtigungen

Phase 1 nutzt berechnete Hinweise aus vorhandenen Quellen: offene Contributions (nur berechtigt), neue Mitgliedsanfragen, anstehende/überfällige Termine, unvollständige Teamdaten und geplante News/Freigaben. Kein roter Punkt ohne tatsächliche Daten. Erst wenn Gelesen-Status, Zustellung, Historie oder persönliche Empfänger benötigt werden, ist ein persistentes Modell zu prüfen. Systemhinweise sind Superadmin/Webmaster vorbehalten; Inhalts- und Abteilungshinweise folgen Permission plus Scope.

## 19. Designprinzipien

Dunkler Hintergrund, Rot, Anthrazit, Weiß und bestehende Statusfarben bleiben. Arbeitsflächen nutzen verfügbare Breite, Listen statt Kachelwände, eine konsistente Aktionszone, kompakte einklappbare Filter, klare Fokuszustände und keine verschachtelten Scrollbereiche. Header- und Navigations-Z-Indizes werden zentral festgelegt.

## 20. Listenmuster

Gemeinsames Muster: kompakter `AdminPageHeader`; Suche und Primäraktion in einer Werkzeugzeile; optionale Kennzahlenleiste; Filter-Drawer/Popover; responsive Tabelle ab Tablet und reduzierte mobile Karten; server- oder URL-basierte Pagination. Kandidaten: `AdminPageHeader`, `AdminToolbar`, Filter-Shell, Summary-Bar, Empty-State, StatusBadge und Pagination.

## 21. Detailseitenmuster

Zurück-Link, Titel/Status, Metazeile und Primäraktionen stehen in einem Kopf. Darunter kompakte Zusammenfassung, logisch getrennte Informationsbereiche, Historie/Unterdaten, Sekundäraktionen und ein klarer Gefahrenbereich am Ende. Player-/Team-/Contribution-Details liefern bereits geeignete Muster; sie müssen später vereinheitlicht werden.

## 22. Migrationsstrategie

1. Kanonische, datengetriebene Navigationskonfiguration ohne UI-Wechsel erstellen.
2. Permission- und Scope-Resolver mit Tests ergänzen; Enforcement- und Department-Mismatch klären.
3. Horizontale Desktopnavigation parallel zur Sidebar hinter Feature-Flag integrieren.
4. Tastatur, Fokus, aktive Route und Überlauf testen.
5. Mobile Drawer-/Accordion-Navigation parallel integrieren.
6. Rollen-/Scope-Matrix automatisiert und manuell prüfen.
7. Sidebar erst nach Parität entfernen und Inhaltsbreite anpassen.
8. Dashboard verdichten.
9. Module nach Priorität auf gemeinsame Listen-/Detailmuster migrieren.

## 23. Risiken

- Permission-Enforcement ist zentral deaktiviert; UI-Sichtbarkeit kann dadurch irreführend sein.
- Navigation ist nicht scope-aware; ein sichtbarer Link kann in einer leeren/unerlaubten Seite enden.
- Department ist Datenklassifikation, noch kein Zugriffsscope.
- `AdminHeader` und `AdminTopbar` duplizieren Verantwortung.
- Globale Suche arbeitet clientnah und ohne erkennbare Permission-/Scope-Filter.
- Medien/Turniere sind sichtbare Navigation ohne implementierte Route.
- Department-Permission ist zwischen Sidebar und Route-Map inkonsistent.
- Rollen-Permission-SQL in `docs/sql` ist teilweise als noch auszuführen markiert; Dokumentation beweist nicht den Live-Zustand.
- Bestehende `startsWith`-Logik benötigt für verschachtelte Bereichsrouten einen längsten/exakten Match-Algorithmus.

## 24. Go-/No-Go-Kriterien

Go nur wenn: eine kanonische Konfiguration existiert; jede Route genau einen Permission-Key hat; produktiver Enforcement-Status geklärt ist; serverseitiger Scope-Kontext für Navigation verfügbar ist; alle aktuellen Links Parität erreichen; Suche abgesichert ist; Desktop/Mobil vollständig per Tastatur bedienbar sind; aktive Route eindeutig ist; Medien/Turniere nicht als tote Links erscheinen; Rollenmatrix gegen Staging geprüft ist. No-Go bei fehlender Scope-Parität, unklaren Live-Permissions, abgeschnittenen Menüs, Fokusverlust oder Big-Bang-Entfernung der Sidebar.

## 25. Empfohlene Teilphasen

- B15.2: Navigationsdomäne, Route-/Permission-Bereinigung und Tests, noch ohne visuelle Umschaltung.
- B15.3: horizontale Desktopnavigation parallel zur Sidebar.
- B15.4: Mobile Drawer/Accordion und Accessibility-Abnahme.
- B15.5: Sidebar-Entfernung und Shell-/Breitenanpassung.
- B15.6: Dashboard-Redesign inklusive Begrüßungslogik und berechneter Hinweise.
- B15.7: gemeinsame Listen-, Filter- und Pagination-Muster.
- B15.8: gemeinsame Detailseiten und Gefahrenbereiche.
- B15.9: Gesamtverein-Module konsolidieren.
- B15.10: Department-Scope-Entscheidung und neue Abteilungsbereiche; Datenmodell/Permissions nur als separat freigegebene Schritte.
