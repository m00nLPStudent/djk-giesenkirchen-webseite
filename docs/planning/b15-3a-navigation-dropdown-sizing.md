# B15.3A – Kompakte Navigation-Dropdowns

## 1. Ausgangslage

Die Desktopnavigation verwendete für jede Section dieselbe 42-rem-Fläche und ab `sm` zwei Spalten. Rollen mit nur einem sichtbaren Eintrag erhielten dadurch ein optisch leeres halbes Mega-Menü.

## 2. Root Cause

Breite und Grid waren statisch im `AdminHorizontalNavigation` hinterlegt. Die bereits serverseitig berechnete Anzahl sichtbarer Items floss nicht in das Layout ein.

## 3. Dynamische Größenlogik

`getNavigationDropdownLayout` leitet eine reine Layoutentscheidung aus aktiven Items mit Route ab: null Items `empty`, eins `compact-single`, zwei `compact-list`, drei bis vier `medium-layout`, ab fünf `mega-grid`. Nicht laufzeitfähige Status werden nicht gezählt.

## 4. Ein-Item-Dropdown

Ein Eintrag nutzt eine Spalte und maximal 22 rem (352 px), begrenzt auf die Viewportbreite. Icon, Label und Beschreibung bleiben vollständig im vorhandenen Linklayout.

## 5. Mehr-Item-Mega-Menü

Zwei Einträge stehen einspaltig bei maximal 24 rem. Drei bis vier Einträge nutzen maximal 36 rem und wechseln bei ausreichender Breite auf zwei Spalten. Ab fünf Einträgen bleibt das bestehende zweispaltige 42-rem-Mega-Menü erhalten.

## 6. Rollenfälle

Der Kassierer erhält bei ausschließlich sichtbaren Vereinsbeiträgen `compact-single`. Trainer und Vorstand erhalten abhängig von ihren aufgelösten Permissions und Scopes das Layout ihrer sichtbaren Anzahl. Der vollständige Gesamtverein des Superadmins bleibt `mega-grid`. Rollennamen sind nicht Teil der Entscheidung.

## 7. Accessibility

Trigger, `aria-expanded`, `aria-controls`, `aria-current`, Escape- und Außenklickbehandlung, Fokus-Rückgabe sowie Pfeil-, Home- und End-Navigation bleiben erhalten. Die Tastaturreihenfolge verwendet dieselbe gefilterte Itemliste wie die Darstellung.

## 8. Tests

Gezielte Tests decken alle Anzahlsklassen von null bis mindestens fünf, Kassierer und Superadmin, die indirekte Wirkung des Permission-Resolvers sowie den Ausschluss von `planned`, `hidden` und `blocked` ab.

## 9. Offene Risiken

Die Positionierung bleibt bewusst bei der bestehenden linken Ausrichtung und viewportbegrenzten Breite. Sehr lange, nicht umbrechbare Inhalte könnten weiterhin gesonderte Overflow-Regeln benötigen. Visuelle Browserprüfungen bei 1280, 1440 und 1920 px bleiben vor der Aktivierung des Feature-Flags empfohlen.
