# B15.3 – Horizontale Desktopnavigation und Mobile-Drawer

## 1. Ziel

Die B15.2-Navigationsdomäne kann hinter einem standardmäßig deaktivierten Flag als horizontale Desktopnavigation und Mobile-Drawer gerendert werden. Sidebar und bisheriger Header bleiben parallel bestehen.

## 2. Feature-Flag

Das serverseitige Flag heißt `ADMIN_HORIZONTAL_NAVIGATION_ENABLED`. Nur der normalisierte String `true` aktiviert es; fehlende, leere oder ungültige Werte ergeben `false`. Es besitzt bewusst kein `NEXT_PUBLIC_`-Präfix, ist im Browser nicht veränderbar und wird nicht lokal gespeichert.

## 3. Einbindung in Admin-Shell

`AdminLayout` bleibt Server Component, wertet das Flag aus und lädt nur bei Aktivierung das DTO. `AdminShell` erhält Boolean und DTO als Props. Die Navigation wird direkt nach dem kanonisch produktiven `AdminHeader` und vor mobilem Legacy-Sidebarpanel/Inhalt eingesetzt. Bei deaktiviertem Flag wird weder DTO noch zusätzlicher Auth-/Scope-Kontext geladen.

## 4. Serverseitiges Navigation-DTO

Der B15.2-Loader liefert ausschließlich das serialisierbare, permission- und scope-gefilterte DTO. Keine Clientkomponente fragt Auth, Permissions, Scope oder Datenbank ab. Da Next-Layouts keinen zuverlässigen aktuellen Pathname-Prop liefern, wird im Client nur der Aktivzustand mit `applyActivePathToNavigationDto` aus dem bestehenden B15.2-Matcher ergänzt. Sichtbare Sections/Items werden dabei nicht neu entschieden und das Eingabe-DTO nicht mutiert.

## 5. Desktopnavigation

Ab 1280 px (`xl`) erscheint eine 56 px hohe zweite Navigationszeile. Übersicht ist ein direkter Link. Sections mit mehreren Items öffnen ein kompaktes Menü. Nur Sections des bereits gefilterten DTO werden gerendert. Die Zeile ist unter dem 88-px-Header sticky; der Sidebar-Sticky-Offset berücksichtigt die zusätzliche Höhe, ohne ihre Breite zu ändern.

## 6. Mega-Menüs

Menüs öffnen per Klick beziehungsweise Enter/Leertaste/Pfeil-ab. Escape und Außenklick schließen. Innerhalb des Menüs navigieren Pfeil hoch/runter sowie Home/Ende. Aktive Items verwenden `aria-current`. Gesamtverein ordnet Benutzer, Rollen und Rechte optisch als Administrationsblock ein. Menüs sind maximal viewportbreit, zweispaltig und erzeugen bei normalen Desktopgrößen keine eigene Scrollfläche.

## 7. Aktive Routen

Der unveränderte B15.2-Matcher nutzt Exact Match für `/admin`, segment-sichere Prefixe und den längsten Treffer. Deshalb aktivieren Detail-, Create- und Editpfade weiterhin genau Mannschaften, Spieler, Trainer, Contributions oder das jeweilige Gesamtvereinmodul. Nur eine Section und ein Item können aktiv sein.

## 8. Icons

`adminNavigation.icons.js` mappt alle String-Keys zentral auf bestehende Lucide-Komponenten. Unbekannte Keys erhalten das Menü-Icon als sicheren Fallback. Das Server-DTO enthält weiterhin keine React-Komponenten.

## 9. Mobile-Drawer

Unter 1280 px ersetzt ein eigener Button die horizontale Zeile; der bestehende Header-Menübutton für die Legacy-Sidebar bleibt zusätzlich erhalten. Der neue Button öffnet einen rechten Drawer mit Übersicht als Direktlink und accordionartigen Sections. Der aktive Bereich ist beim Öffnen expandiert. Linkklick, Schließen-Button, Escape und Backdrop schließen den Drawer.

## 10. Accessibility

Desktopbuttons verwenden `aria-expanded`/`aria-controls`; aktive Links `aria-current`. Escape gibt Fokus an den auslösenden Desktopbutton zurück. Der Mobile-Drawer besitzt `role="dialog"`, `aria-modal`, anfänglichen Fokus auf Schließen, zyklische Tab-Fokusbindung, Escape, Fokus-Rückgabe und Body-Scroll-Sperre. Buttons und Links sind mindestens 44 px hoch, lange Labels dürfen umbrechen.

## 11. Responsive

Der Wechsel erfolgt bewusst bei 1280 px: 1920/1440/1280 nutzen Desktop, 1180/1024/900/768/430/375 den Drawer. Damit werden die sechs Zielbereiche nicht bei 1024 px gequetscht. Komponenten verwenden viewportbegrenzte Breiten und erzeugen keine horizontale Seiten-Scrollbar.

## 12. Z-Index

Bestehender Header: `z-40`. Horizontale Navigation und Menüs: Layer `z-30` unter dem Header, aber über normalem Inhalt. Mobile-Drawer: `z-50`, über Header und Inhalt. Diese Werte bleiben im vorhandenen Projektspektrum; es werden keine extremen Layer eingeführt. Kritische Dialoge sollten in einer späteren gemeinsamen Layer-Konvention oberhalb des Drawers liegen.

## 13. Sidebar-Parität

Alle funktionierenden Sidebarziele sind in der neuen Navigation enthalten. `/admin/media` und `/admin/tournaments` sind absichtlich nicht enthalten, da keine Routes existieren; sie sind B15.2-planned und nicht klickbar. Die neue Navigation ist zusätzlich scope-aware, die alte Sidebar nicht. Außerdem umgeht die Legacy-UI-Sichtbarkeit bei `AUTH_ENFORCEMENT_ENABLED=false` Permissions; das sichere DTO tut dies nicht. Diese fachlich beabsichtigten Unterschiede müssen vor einer späteren Sidebar-Entfernung geklärt werden.

## 14. Rollen und Scopes

Superadmin, Kassierer, Vorstand, Trainer, Youth-Verantwortliche und eingeschränkte Kontexte werden weiterhin ausschließlich durch B15.2-Resolverausgaben bestimmt. Contributions-read-only bleibt DTO-Metadatum und verändert keine Fachlogik. Scope-lose Teamrollen erhalten keine leere Fußballsection. Department-Scope wird nicht ergänzt.

## 15. Geplante Abteilungen

Tischtennis, Behindertensport und Gymnastikdamen besitzen keine aktiven DTO-Items und werden deshalb weder Desktop noch mobil dargestellt. Es gibt keine „Demnächst“-Links oder 404-Ziele.

## 16. Tests

Reine Tests prüfen Flagwerte/Default, Sidebar-Persistenz, Breakpointentscheidung, vollständiges Icon-Mapping/Fallback, unverändertes DTO, aktive Routen, initiales Mobile-Accordion, Fokusindex-Wrapping, Sidebar-Zielparität und Ausschluss geplanter beziehungsweise sensitiver Daten. B15.2-Resolver- und Matchertests laufen gemeinsam. Interaktionen sind zusätzlich durch gezieltes ESLint und Build abgesichert; echte Browser-Fokus-/Viewporttests bleiben manuell.

## 17. Lokaler Testablauf

In `.env.local` setzen: `ADMIN_HORIZONTAL_NAVIGATION_ENABLED=true`. Danach den Next-Server neu starten, da das Flag serverseitig beim Rendern gelesen wird. Zum Abschalten Wert entfernen oder `false` setzen und erneut starten. Das Flag wurde nicht automatisch in einer Umgebung gesetzt.

## 18. Risiken

- Legacy-Sidebar und neues DTO unterscheiden sich solange der zentrale Enforcement-Bypass aktiv ist.
- Die neue Navigation erzeugt bei aktivem Flag zusätzlich zum clientseitigen Legacy-UI-Kontext einen serverseitigen Auth-/Scope-Ladevorgang; innerhalb der neuen Navigation wird er request-lokal dedupliziert.
- Mobile zeigt während der Parallelphase zwei bewusst verschiedene Menüzugänge.
- Headerhöhe 88 px ist am Desktop stabil; die Navigation ist mobil nicht sticky, weil der Header dort mehrzeilig werden kann.
- Browserbasierte Regression, Fokusführung und Viewport-Overflow benötigen einen manuellen Lauf mit realen Rollen.

## 19. Empfohlener nächster Schritt

Das Flag in einer lokalen oder Staging-Umgebung aktivieren und die dokumentierte Rollen-/Viewportmatrix manuell abnehmen. Vor B15.4 beziehungsweise einer breiteren Aktivierung sollten Legacy-Enforcement, Department-Permission und gemeinsame Auth-Kontextversorgung entschieden werden.
