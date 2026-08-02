# B15.4 – Produktive Navigationsübernahme

## 1. Ziel

Die permission- und scope-gefilterte horizontale Navigation und ihr Mobile-Drawer sind das einzige primäre Navigationssystem des Adminbereichs.

## 2. Ausgangslage

B15.2 stellte Domäne, Resolver und Matcher bereit. B15.3 integrierte Desktopnavigation und Drawer parallel zur Sidebar hinter einem Flag; B15.3A ergänzte dynamische Dropdowngrößen.

## 3. Manuelle Abnahme B15.3

Superadmin, Vorstand, Kassierer, Jugendverantwortliche und Trainer sowie Desktop, Mobile, Permissions, Scopes, aktive Routen, kompakte Dropdowns und Mega-Menüs wurden laut Aufgabenfreigabe erfolgreich abgenommen. B15.4 interpretiert diese Logik nicht neu.

## 4. Flag-Entscheidung

Variante A wurde umgesetzt. `ADMIN_HORIZONTAL_NAVIGATION_ENABLED`, sein Parser und alle Branches wurden entfernt. Das serverseitige Navigation-DTO wird kanonisch für jedes Adminlayout geladen. Ein paralleler Legacy-Pfad würde die geprüfte Einzelquelle wieder duplizieren.

## 5. Sidebar-Entfernung

`AdminSidebar.js`, beide Renderpfade, Open-State, Backdrop, 260-px-Gridspalte und Sidebar-Scrollbar-CSS wurden entfernt. Im aktiven Layout existiert weder ein Sidebar-Container noch reservierte Breite.

## 6. Horizontale Navigation

Ab 1280 px steht die bestehende 56-px-Navigationszeile sticky unter dem Header. Resolver, Matcher, Icons, Direktlink, Dropdowns und B15.3A-Größenlogik bleiben unverändert.

## 7. Mobile-Drawer

Unter 1280 px öffnet ausschließlich der 44-px-Button im Header den bestehenden kontrollierten Drawer. Der frühere zweite Trigger und die mobile Legacy-Sidebar wurden entfernt.

## 8. Header

Suche, Uhrzeit, Website-Link, Benachrichtigung, Profil, Inhalte, Farben und Grundhöhe bleiben erhalten. Nur der vorhandene Menükopf wurde mit dem kanonischen Drawer verbunden und auf den `xl`-Breakpoint abgestimmt.

## 9. Contentbreite

Der Shell-Wrapper ist nun ein zentrierter `w-full max-w-7xl`-Container mit responsiven Innenabständen. Die Sidebar-Gridspalte entfällt; lokale Modulbreiten bleiben unangetastet.

## 10. Sticky-Offsets

Zentral im Shell-Bereich gelten 88 px Headerhöhe und 56 px Navigationshöhe. Der Header liegt bei `top: 0`; die Desktopnavigation bei `top: var(--admin-header-height)`. Der Content bleibt im normalen Dokumentfluss.

## 11. Z-Index

Normaler Content bildet die Basis. Desktopnavigation und Mega-Menüs verwenden Layer 30, der Header einschließlich Profil/Suche Layer 40 und der Mobile-Drawer samt Backdrop Layer 50. Bestehende Dialog- und Toastlayer wurden nicht fachlich umgebaut und müssen bei einer späteren gemeinsamen Layer-Konvention oberhalb modaler Navigation geprüft werden.

## 12. Permission-/Scope-Parität

Das DTO bleibt ausschließlich Ergebnis des B15.2-Resolvers. Rollenstrings steuern kein Layout und keine Sichtbarkeit. Tests decken globale, Board-, Kassierer-, Trainer-, Youth-, Betreuer-, Gast- und scope-lose Kontexte ab; leere Sections und geplante Items bleiben ausgeschlossen.

## 13. Department-Mismatch

Die tatsächliche Seite `/admin/department` und ihre Board-Actions verwenden `settings.view` beziehungsweise `settings.edit`. Navigation, zentrale Route-Regel und Navigations-Permission-Map wurden deshalb einheitlich auf den bestehenden Key `settings.view` plus `board_access` ausgerichtet. Es wurden keine Permission-Definitionen oder Rollenrechte erweitert.

## 14. Accessibility

Desktopnavigation behält ARIA-Zustände und Tastatursteuerung. Der einzige mobile Headerbutton hat Label, `aria-expanded`, `aria-controls` und 44-px-Touchfläche. Der Drawer behält Dialogsemantik, Fokusbindung, Escape, Backdrop, Fokus-Rückgabe und Body-Scroll-Sperre. Keine unsichtbare Sidebar bleibt im Accessibility Tree.

## 15. Responsive

1920, 1440 und 1280 px verwenden Desktopnavigation. 1180, 1024, 900, 768, 430 und 375 px verwenden Headerbutton und Drawer. Die Desktopnavigation ist unterhalb `xl` verborgen; der Shell-Content bleibt ohne linken Offset vollbreit.

## 16. Rollback

Rollback erfolgt durch Git-Revert der B15.4-Änderungen. Da kein Commit durch diese Aufgabe erstellt wird, kann bis zur späteren Übernahme anhand des Arbeitsbaum-Diffs zurückgerollt werden. Es bleibt keine zweite Legacy-Architektur als Laufzeit-Schalter bestehen.

## 17. Entfernte Legacy-Komponenten

Entfernt wurden `AdminSidebar.js`, `adminNavigation.flags.js`, Sidebar-Imports und -Renderpfade, der mobile Sidebar-Statepfad, die 260-px-Spalte sowie `.admin-sidebar-scrollbar`. Generische Auth-, Header-, Brand- und Contentkomponenten bleiben erhalten.

## 18. Tests

Node-Tests prüfen Domäne, Resolver, Matcher, Dropdowngrößen, Cutover-Struktur, Breakpoints, Rollen-/Scope-Fälle und Department. Gezieltes ESLint, Projektlint und Produktions-Build ergänzen die Prüfung. Browser- und echte Login-Regressionen bleiben manuell.

## 19. Risiken

Dialog-/Toast-Layer sind projektweit nicht zentralisiert. Browserautomatisierung und echte Rollensitzungen sind nicht Teil der lokalen Node-Tests.

## 20. Empfohlener nächster Schritt

Nach einem finalen Staging-Smoke-Test den Cutover gemeinsam committen. Danach kann B15.5 das Dashboard bearbeiten, ohne die Navigationsarchitektur erneut anzufassen.
