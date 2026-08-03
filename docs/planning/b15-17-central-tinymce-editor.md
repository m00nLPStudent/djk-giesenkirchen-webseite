# B15.17 – Zentraler TinyMCE-Editor

## 1. Ziel

Alle tatsächlich vorhandenen HTML-Felder verwenden eine zentrale, lokal gebündelte TinyMCE-Komponente. Datenformat, Payloads, Uploads und Fachlogik bleiben unverändert.

## 2. Bisherige Editorarchitektur

Zuvor existierte ein zentraler TipTap-Editor mit eigener Toolbar. Er wurde von Vereinsgeschichte und CMS-Seiten verwendet. News nutzte für `content_de` eine Textarea. Die übrigen untersuchten Beschreibungen werden öffentlich als einfacher Text ausgegeben und sind daher keine nachgewiesenen HTML-Felder.

## 3. Installierte Version

- TinyMCE 8.8.2
- `@tinymce/tinymce-react` 6.3.0
- Next.js 16.2.9 und React 19.2.4

## 4. Zentrale Komponentenstruktur

- `AdminRichTextEditor.js`: öffentliche kontrollierte API, Label, Hilfen, Fehler und client-only Lazy Loading
- `AdminTinyMceEditor.js`: einzige direkte TinyMCE-Integration
- `adminRichTextEditor.config.js`: einzige Plugin-, Toolbar- und Content-Style-Konfiguration
- `adminRichTextEditor.helpers.js`: wertneutrale HTML-Helfer

## 5. Komponenten-API

Unterstützt werden `id`, `name`, `label`, `value`, `onChange`, `disabled`, `readOnly`, `required`, `error`, `helpText`, `placeholder`, `minHeight`, `aria-describedby` und `toolbarMode`. Die Komponente enthält keine Speicherung oder Fachlogik.

## 6. Plugins

Verwendet werden ausschließlich lokale Core-Plugins: advlist, anchor, autolink, autoresize, charmap, code, fullscreen, help, image, link, lists, searchreplace, table, visualblocks und wordcount.

## 7. Toolbar

Undo/Redo, Blockformat, Fett, Kursiv, Unterstrichen, Durchgestrichen, Farben, Ausrichtung, Listen, Ein-/Ausrücken, Blockquote, Link, Tabelle, horizontale Linie, Sonderzeichen, Formatierung entfernen, Suche/Ersetzen, Quellcode, Vollbild und Hilfe. Zusätzlich existiert ein zentraler kompakter Modus.

## 8. Content-Styles

Die Editorfläche verwendet ein dunkles, responsives Layout für Fließtext, H1–H4, Listen, Links, Tabellen, Blockquotes, Bilder und Trennlinien. Bilder sind auf die verfügbare Breite begrenzt.

## 9. HTML-Kompatibilität

Der kontrollierte Wert wird unverändert an TinyMCE übergeben und von `onChange` als HTML zurückgegeben. Es gibt keine Migration zu Markdown, JSON oder Blocks und keinen Backfill.

## 10. Sanitizer und Sicherheit

Die bestehende zentrale Ausgabe-Bereinigung in `src/lib/richtext/sanitize.js` bleibt maßgeblich. Sie wurde auf sichere TinyMCE-Core-Ausgabe für Tabellen, Blockquotes, Bilder, Trennlinien und Farben erweitert. Script-, iframe-, object-, embed-, Eventhandler- und `javascript:`-Inhalte bleiben ausgeschlossen.

## 11. Bild- und Mediengrenzen

Externe oder bereits gespeicherte HTTP(S)-Bild-URLs können erhalten und dargestellt werden. Kein Upload, Dateibrowser, Medienpicker, Drag-and-drop-Upload oder Supabase-Zugriff wurde ergänzt.

## 12. News

`content_de` verwendet TinyMCE. Titel, Teaser, Kategorie, Medien, Dokumente, Payload und Speicherung bleiben unverändert. Die öffentliche Detailseite rendert den Inhalt über den zentralen Sanitizer.

## 13. Vereinsgeschichte

Der bestehende HTML-Hauptinhalt verwendet durch Austausch der zentralen Komponente nun TinyMCE. Meilenstein-Kurzbeschreibungen und Bildtexte bleiben Textareas.

## 14. CMS-Seiten

Der bestehende deutsche Seiteninhalt verwendet TinyMCE. Verdeckte EN-Daten, Slug, Status, Sortierung, Routing und Payloadschutz bleiben unverändert.

## 15. Mannschaften

`description_de` und `description_en` bleiben Textareas: Die Bestandsanalyse weist sie als einfache öffentlich escaped Kurzbeschreibung aus, nicht als HTML-Inhalt.

## 16. Sponsoren

Beide Beschreibungen bleiben Textareas, da die öffentliche Karte sie als einfachen Text rendert. Upload, Links und Payload bleiben unverändert.

## 17. Weitere Module

Terminbeschreibung, Spielerbeschreibung, Dokumenttexte und Notizen bleiben einfache Textfelder. Keines dieser Felder war als HTML-Ausgabe implementiert.

## 18. Zukünftige Downloads

Es wurde keine Download-Fachlogik entwickelt. Künftige nachgewiesene HTML-Felder können ausschließlich über `AdminRichTextEditor` angebunden werden.

## 19. Entfernte Legacy-Komponenten

Der Inhalt der bisherigen zentralen TipTap-Komponente wurde ersetzt. Die fünf TipTap-Abhängigkeiten wurden nach vollständiger Referenzprüfung entfernt. Es bleibt keine parallele Editorarchitektur.

## 20. Responsive

Der Editor ist auf die Containerbreite begrenzt, die Toolbar verwendet den Wrap-Modus, Dialoge stammen aus dem zentralen TinyMCE-Core und Bilder überschreiten die Editorbreite nicht.

## 21. Accessibility

Sichtbares Label, Pflichtfeldkennzeichnung, Hilfetext, Fehlertext mit `role=alert`, sichtbarer Fokus, ARIA-Beschreibung und TinyMCE-Tastatur-/Dialogsteuerung werden verwendet.

## 22. Performance

TinyMCE wird per `next/dynamic` mit `ssr: false` nur innerhalb gerenderter Editorfelder geladen. Listen und reine Detailansichten importieren das Bundle nicht. TinyMCE räumt seine Instanz über die offizielle React-Integration beim Unmount auf.

## 23. Tests

Core-Tests prüfen Konfiguration, Plugins, Toolbar, HTML-Passthrough und leere Inhalte. UI-Strukturtests prüfen Client-Isolation, API, kontrolliertes Verhalten, zentrale Imports, unveränderte News-Payload und sichere öffentliche Ausgabe.

## 24. Risiken

TinyMCE normalisiert beim tatsächlichen Bearbeiten browserbedingt HTML-Strukturen. Unverändertes Laden allein löst keine fachliche Speicherung aus. Ein visueller Browsertest benötigt eine laufende Adminsitzung.

## 25. Erweiterungspunkte für B15.18

Bild- oder Medienauswahl kann später ausschließlich in `AdminTinyMceEditor.js` über TinyMCE-Callbacks ergänzt werden, ohne Fachformulare oder Payloads erneut umzubauen.
