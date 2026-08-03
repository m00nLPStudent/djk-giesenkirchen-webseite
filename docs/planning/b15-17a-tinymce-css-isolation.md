# B15.17A – TinyMCE-CSS-Isolation

## Root Cause

`AdminTinyMceEditor.js` importierte `tinymce/skins/content/dark/content.css` als normales Side-Effect-CSS. Next.js/Turbopack legte dieses Stylesheet beim ersten dynamischen Laden des Editor-Bundles in das Hauptdokument. Die Datei enthält eine ungekapselte Regel:

```css
body {
  background-color: #222f3e;
  color: #fff;
}
```

Damit wurde nicht nur das TinyMCE-Iframe, sondern der Body der gesamten Adminoberfläche blau eingefärbt. Der Effekt trat nach Clientnavigation auf, weil das dynamische Editor-CSS erst beim ersten Mount nachgeladen wurde. Nach F5 war die CSS-Reihenfolge anders, wodurch das bestehende Admin-Theme scheinbar wieder gewann.

Zusätzlich war `tinymce/skins/ui/oxide-dark/content.css` als globaler Import unnötig. Diese Datei ist für Editorinhalte bestimmt, nicht für das Hauptdokument.

## Korrektur

- Beide Content-Skin-Side-Effect-Imports wurden entfernt.
- Der UI-Skin `oxide-dark/skin.css` bleibt lokal gebündelt. Seine visuellen Regeln sind auf TinyMCE-Klassen wie `.tox` und `.tox-tinymce-aux` begrenzt.
- `skin: false` verhindert ein zweites Nachladen des UI-Skins.
- `content_css: false` verhindert ein zusätzliches Content-Stylesheet.
- Alle Inhaltsstyles werden über `content_style` ausschließlich in das TinyMCE-Iframe injiziert.
- Das Iframe erhält die eindeutige Bodyklasse `admin-richtext-content`.
- Der äußere Feldcontainer trägt `admin-richtext-editor`.

## Globale Zustände

Die Integration verändert weder `document.body` noch `document.documentElement`, globale Klassen, Inline-Styles oder CSS-Variablen. Deshalb ist beim Unmount keine globale Style-Bereinigung notwendig. Die offizielle React-Integration entfernt die jeweilige Editorinstanz; eindeutige IDs entstehen weiterhin über React `useId()`.

## Unverändert

TinyMCE-Version, Plugins, Toolbar, iframe-Modus, HTML, Sanitizer, Payloads, Actions, Uploads, Medienlogik, Datenbank, Permissions, Scopes und Routing bleiben unverändert.
