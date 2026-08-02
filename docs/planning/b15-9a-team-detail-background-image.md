# B15.9A – Mannschaftsbild als Detailkachel-Hintergrund

## 1. Ziel

Die bestehende oberste Mannschafts-Informationskachel erhält optional einen sehr dezenten, dekorativen Bildhintergrund. Es entsteht kein separater Hero und keine zusätzliche Seitenhöhe.

## 2. Betroffene Kachel

Angepasst ist ausschließlich der gemeinsame `AdminDetailHeader` auf der Mannschaftsdetailseite. Struktur, Inhalte, Status und Aktionen bleiben erhalten.

## 3. Verwendete Bildquelle

Verwendet wird ausschließlich das bereits geladene kanonische Feld `team.team_image_url`. Die bestehende Team-Abfrage bleibt unverändert.

## 4. Overlay-Strategie

Das Bild wird mit `object-cover`, neun Prozent Deckkraft, Graustufen, reduzierter Sättigung und einem Blur von einem Pixel dargestellt. Darüber liegt ein starkes anthrazitfarbenes Overlay mit einem sehr schwachen roten Auslauf.

## 5. Kontrast

Bild und Overlay liegen auf Ebene 0; sämtliche Inhalte liegen mit `relative z-10` darüber. Auf kleinen Viewports wird das Overlay nochmals leicht verstärkt.

## 6. Fehlendes Bild

Bei einem fehlenden oder leeren Bildwert wird kein `img` gerendert. Der Header zeigt unverändert seine normale Design-System-Oberfläche.

## 7. Fehlerhafte URL

Ein lokaler, einmaliger `onError`-Zustand entfernt das dekorative Bild. Es gibt kein defektes Bildsymbol, keinen zusätzlichen Fetch und keine Layoutverschiebung.

## 8. Responsive Verhalten

Der absolut positionierte Hintergrund folgt immer der tatsächlichen Kachelhöhe. `object-cover` verhindert Verzerrungen; das Motiv ist bei `center 38%` ausgerichtet. Das stärkere mobile Overlay schützt Titel und gestapelte Aktionen.

## 9. Performance

Die Darstellung ist statisch und animationsfrei. Verwendet werden nur einfache CSS-Filter; es gibt weder Parallax noch Zoom oder zusätzliche Netzwerkanfragen durch Anwendungslogik.

## 10. Accessibility

Das Bild ist rein dekorativ (`alt=""`, `aria-hidden="true"`). Semantik, Fokuszustände und Beschriftungen der vorhandenen Links und Buttons bleiben unverändert.

## 11. Design-System-Entscheidung

`AdminDetailHeader` erhält die optionalen Props `backgroundImageUrl` und `backgroundPosition`. Ohne diese Props bleibt das bisherige Verhalten erhalten. Aktiviert wird die Variante derzeit nur durch die Mannschaftsdetailseite.

## 12. Tests

Ein fokussierter UI-Quelltest prüft kanonische Bildquelle, Layering, responsive Klassen, Leer- und Fehlerzustand sowie die unveränderten Editier-, Archivierungs- und Query-Anker. Ergänzend werden Team-, Design-System- und Projektprüfungen ausgeführt.

## 13. Risiken

Die konkrete Motivwirkung hängt vom Bildzuschnitt der hochgeladenen Mannschaftsbilder ab. Die starke Abdunklung schützt die Lesbarkeit, kann bei bereits sehr dunklen Bildern aber dazu führen, dass das Motiv kaum sichtbar ist.

## 14. Empfohlener nächster Schritt

Die Variante mit realen Mannschaftsbildern auf den vereinbarten Desktop-, Tablet- und Mobilbreiten visuell abnehmen. Eine Übertragung auf weitere Module sollte nur nach einer eigenen fachlichen Entscheidung erfolgen.
