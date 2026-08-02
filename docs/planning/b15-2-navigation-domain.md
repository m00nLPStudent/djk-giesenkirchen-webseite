# B15.2 – Zentrale Navigationsdomäne und serverseitiger Visibility-Resolver

## 1. Ziel

B15.2 stellt eine gemeinsame, nicht sichtbare Navigationsdomäne für spätere Desktop- und Mobile-Navigation bereit. Sidebar, Header, mobile Navigation und Routen bleiben unverändert.

## 2. Bestehende Quellen

Grundlagen sind die fünf B15.1-Artefakte, `AdminSidebar`, `AdminShell`, beide Header-/Topbar-Stränge, `adminPermissionConfig`, Permission-Engine, serverseitige Action-Guards, Scope-Kontext/-Engine und die globale Suche. Bestehende Permission-Keys werden referenziert, nicht dupliziert oder verändert.

## 3. Navigationskonfiguration

`adminNavigation.config.js` beschreibt Sections und Items unabhängig von React. Die Konfiguration enthält ausschließlich Daten sowie kleine lokale Fabrikfunktionen beim Modulaufbau. Das an Clients übergebene DTO enthält diese Funktionen nicht. Aktive Items besitzen eindeutige Admin-Hrefs; geplante Items besitzen immer `href: null`.

## 4. Sections

Konfiguriert sind `overview`, `club`, `football`, `table_tennis`, `disabled_sports` und `gymnastics`. Übersicht ist ein eigener Hauptbereich. Systemadministration liegt als klar abgegrenzter Unterbereich innerhalb Gesamtverein, weil kein siebter Hauptbereich freigegeben ist. Leere Sections werden aus dem Runtime-DTO entfernt.

## 5. Items

Aktiv: Dashboard; News, Termine, Sponsoren, Vereinsgeschichte, Vereinsstruktur, kombinierte Seiten/Kontakte/Einstellungen, Benutzer, Rollen und Rechte; Mannschaften, Spieler, Trainer und Vereinsbeiträge. Profil bleibt bewusst im vorhandenen Profilmenü. Mitgliedsanfragen sind bis zu einer eindeutigen Unterroute `planned`, damit kein zweiter aktiver `/admin/settings`-Eintrag entsteht.

Medien, Turniere, Spielbetrieb, Fußball-Ansprechpartner sowie sämtliche neuen Abteilungsverwaltungen sind `planned` und nicht klickbar. Die bestehende Sidebar wird noch nicht aus dieser Konfiguration gespeist und bleibt sichtbar unverändert.

## 6. Permission-Resolver

`resolveAdminNavigation` erhält explizite Permission-Keys. Ein aktives Item wird nur ausgegeben, wenn mindestens einer seiner bestehenden Keys vorhanden ist. Rollenstrings schalten kein Item primär frei. Schreibberechtigungen werden nur zur DTO-Kennzeichnung `isReadOnly` verwendet. Der zentrale globale Enforcement-Schalter wird nicht als Navigation-Bypass übernommen; der Loader arbeitet mit den tatsächlich geladenen Permissions.

## 7. Scope-Verhalten

Permission bleibt die erste Schranke. `permission_only` erfordert keinen Zielscope. `team_access` nutzt vorhandene globale, Youth-, zugewiesene Team- und Own-Board-Marker. `staff_access` ergänzt den vorhandenen Own-Staff-Marker. `board_access` nutzt global oder Own-Board. Damit werden bestehende Scope-Ergebnisse ausgewertet, ohne Scope-Engine oder Department-Modell zu verändern. `department_unavailable` ist absichtlich niemals runtimefähig.

Trainer ohne Team-Scope erhalten keine Team-/Player-Links. Youth-Scope kann erlaubte Fußballmodule erreichen. Contributions benötigen weiterhin `contributions.view`; scoped Statussicht in fremden Modulen erzeugt keinen Zugriff auf die Contribution-Route. Department-Scope wird nicht erfunden.

## 8. Navigation-DTO

Das DTO enthält `sections`, `activeSectionKey` und `activeItemKey`. Sections und Items enthalten nur serialisierbare Strings, Booleans, `null` und Arrays/Objekte. Nicht enthalten sind Permissionsammlungen, Scope-IDs, Profil-/Sessiondaten, Supabase-Clients, Funktionen, React-Komponenten oder Secrets. Desktop und Mobil können dasselbe DTO verwenden.

## 9. Route-Matching

Der Matcher normalisiert Query/Hash und abschließende Slashes. Exact Match aktiviert `/admin` nur exakt. Prefixe matchen nur identische Pfade oder echte Segmentgrenzen (`prefix/…`), nicht ähnlich benannte Routen. Der längste Treffer gewinnt; damit kann nur ein Item aktiv sein. Details, Neu-/Editseiten und dynamische IDs bleiben dem Modul zugeordnet.

## 10. Feature-Status

Zentral zulässig sind `active`, `planned`, `hidden` und `blocked`. Active benötigt Href, Permission und Scope. Planned ist standardmäßig ausgeschlossen und kann nur über das interne Flag `includePlanned` als nicht klickbare Vorschau in ein DTO gelangen. Hidden und blocked werden niemals ausgegeben. Blockierungsgründe bleiben Konfiguration/Dokumentation und gelangen nicht als sensible Details zum Client.

## 11. Icons

Konfiguration und DTO nutzen String-Keys wie `shield`, `users` oder `wallet`. Eine spätere Clientkomponente mappt diese auf die bereits installierten Lucide-Icons. Dadurch bleiben DTOs serialisierbar und es entsteht keine neue Icon-Abhängigkeit.

## 12. Server-Loader

`adminNavigation.loader.js` ist durch `server-only` geschützt. `loadAdminNavigation` lädt den bestehenden Admin-Kontext über `assertAdminActionPermission`, baut mit `loadAdminProfileScopeContext` den vorhandenen Scope und ruft den reinen Resolver auf. Bei bereits vorhandenem Authkontext kann `loadAdminNavigationFromAuthContext` verwendet werden, um die Permission-Abfrage nicht zu wiederholen. Bei fehlender Berechtigung entsteht ein leeres DTO; Service-Role- oder Profildaten werden nie zurückgegeben.

## 13. Request-Caching

Der Default-Loader ist mit React `cache()` request-lokal dedupliziert. Es gibt keinen globalen Navigation-Cache und kein `use cache`, damit personalisierte Permissions/Scopes nicht benutzerübergreifend geteilt werden. Aufrufer sollten innerhalb desselben Server-Renderings denselben Pfad und denselben Flagwert verwenden oder den bereits geladenen Authkontext weiterreichen.

## 14. Globale Suche

Die bestehende Suche bleibt unverändert. Ihr Service verwendet clientnahen Datenzugriff und besitzt keine erkennbare gemeinsame Permission-/Scope-Entscheidung. In einer Folgephase soll die Suche serverseitig je Ergebnistyp zunächst denselben Navigation-Visibility-Entscheid beziehungsweise einen daraus extrahierten Resource-Visibility-Helper anwenden und danach entity-spezifische Team-/Person-Scopes prüfen. B15.2 erweitert keine Suchergebnisse und vermeidet bewusst eine unvollständige Teilabsicherung.

## 15. Tests

Reine Node-Tests prüfen eindeutige Keys/Hrefs/Orders, aktive Adminrouten und Permissions, nicht klickbare planned Items, globale Sicht, Kassierer, Vorstand/read-only, Trainer mit/ohne Team, Youth-Scope, leere Sections, fehlenden Department-Scope, alle geforderten Routefälle, längsten Prefix, genau ein aktives Item sowie serialisierbares und secretfreies DTO. Gezieltes ESLint deckt die Navigationsdomäne ab.

## 16. Risiken

- Live-Permissiondaten können von SQL-Proposals abweichen.
- Own-Board als bestehender Scope-Marker ist breiter als ein künftiger generischer Department-Scope.
- `/admin/department` bleibt zwischen Route-Map (`system.view`) und produktiver Sidebar/Page (`settings.view`) inkonsistent; B15.2 verändert keine Rechte und folgt für die neue Konfiguration dem sichtbaren/seitigen `settings.view`.
- Mitgliedsanfragen teilen derzeit `/admin/settings`; ohne eindeutige Route wäre Active-Matching mehrdeutig.
- Suche verwendet die neue Domäne noch nicht.
- Die neue Domäne wird noch nicht gerendert und hat daher noch keinen visuellen Regressionseffekt.

## 17. Empfohlener nächster Schritt

B15.3 sollte eine horizontale Desktopnavigation hinter einem standardmäßig deaktivierten Feature-Flag aufbauen, Icon-Key-Mapping ergänzen und das Loader-DTO serverseitig einspeisen. Vor Aktivierung sind Live-Permissions, `/admin/department` und die Mitgliedsanfragen-Route zu entscheiden.
