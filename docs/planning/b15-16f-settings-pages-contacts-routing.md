# B15.16F – Settings-Seiten und Kontakte

## 1. Ziel
CMS-Seiten und allgemeine Kontakte verwenden Vollbreitenübersichten und eigenständige New-/Edit-Seiten.

## 2. Ausgangslage
Beide Tabs renderten Liste und Formular dauerhaft nebeneinander.

## 3. Altes Master-Detail-Muster
Die geteilten Panels begrenzten Listenbreite und hielten Formulare auch ohne konkrete Bearbeitung sichtbar.

## 4. Neue Seitenübersicht
Der Seiten-Tab enthält nur Überschrift, Neuanlageaktion, responsive Liste und Empty State.

## 5. Seiten-New-/Edit-Routen
Verwendet werden `/admin/settings/pages/new` und `/admin/settings/pages/edit/[id]` mit dem bestehenden Settings-Guard.

## 6. Deutsche CMS-Pflege
Sichtbar bleiben Slug, deutscher Titel, deutscher Inhalt, Veröffentlichungsstatus, Footer-Sichtbarkeit und Sortierung.

## 7. Erhalt englischer Daten
Englische Felder fehlen im sichtbaren Formular und im partiellen Update-Payload. Bestehende Datenbankwerte werden dadurch nicht überschrieben.

## 8. Neue Kontaktübersicht
Der Kontakt-Tab enthält nur Überschrift, Neuanlageaktion sowie Desktoptabelle beziehungsweise mobile Karten.

## 9. Kontakt-New-/Edit-Routen
Verwendet werden `/admin/settings/contacts/new` und `/admin/settings/contacts/edit/[id]`.

## 10. Formulare
Jede Route rendert genau ein kompaktes Formular im gemeinsamen Detaillayout, ohne parallele Liste.

## 11. Uploads
Die vorhandene Kontaktbild-Upload- und Löschlogik wird unverändert wiederverwendet.

## 12. Redirects
Nach Create führt der Ablauf zur neuen Edit-Route. Nach Delete geht es zum jeweiligen Settings-Tab zurück.

## 13. Permissions und Scopes
`settings.view`, bestehende `settings.edit`-Gates und vorhandene Scopes bleiben unverändert.

## 14. Responsive
Übersichten sind vollbreit. Formulare gruppieren kompakt und bleiben ohne horizontale Scrollcontainer bedienbar.

## 15. Accessibility
Navigation erfolgt über Links, Aktionen über Buttons, Status textuell, Bilder mit Alttext und Gefahraktionen eindeutig im unteren Bereich.

## 16. Tests
Regressionen prüfen Listen-only-Übersichten, vier Routen, Guards, deutsche CMS-Pflege, EN-Payloadschutz, Bilder, Empty States und Redirects.

## 17. Risiken
Die clientseitigen Bestandsservices bleiben unverändert. Ein manueller Test mit produktionsnahen Inhalten und Rollen bleibt erforderlich.

## 18. Empfohlener nächster Schritt
Visueller und funktionaler Rollentest der vier neuen Routen an allen Ziel-Viewports.
