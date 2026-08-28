# Modul: Website

## Status

Der funktionale Responsive Release ist abgeschlossen. Die finale visuelle, mobile, barrierefreie und inhaltliche Gesamtvereinsabnahme ist nicht abgeschlossen und wird unter B15.24 bearbeitet. B15.24A hat 30 öffentliche Seiten und zwei öffentliche Handler inventarisiert; nächster Block ist B15.24B – Gesamtvereins-Informationsarchitektur und Navigation. Der vollständige Befund steht unter [`../planning/b15-24a-public-website-inventory.md`](../planning/b15-24a-public-website-inventory.md).

Die zukünftige Website behandelt Fußball, Tischtennis, Behindertensport und Gymnastikdamen als Abteilungen desselben Gesamtvereins. Eine externe Referenz für die hellere visuelle Richtung steht noch aus; bis dahin ist keine finale Designpalette beschlossen.

## Öffentliche Kernbereiche

- Startseite mit News-Blöcken
- Vereinsübersichtsseite `/verein`
- News-Übersicht und News-Detailseiten
- Termine-Bereich mit allgemeinen Terminen und virtuellen Trainings
- Fußball-Übersichtsseite und Mannschaftsseiten
- Abteilungsseiten (Vorstand, Trainer)
- Sponsorenübersicht
- Vereinsgeschichte
- Kontaktseite
- Impressum
- Datenschutz
- Mitglied-werden-Seite

## Umgesetzte Querschnittsfunktionen

- dynamischer Footer
- Navigation mit Desktop-Dropdowns und mobilem Burger-Menü
- Pages-CMS-Anbindung über `pages`
- Vereinsdaten aus `club_settings`
- Kontaktdaten aus `club_contacts`

## Responsive

- mobile-first über alle öffentlichen Seiten
- historisch auf 360, 375, 390, 414, 768, 1024 und Desktop validiert; nach der B15.24-Überarbeitung ist eine neue reale Geräte-/Browserabnahme erforderlich
- kein horizontales Seitenscrolling als Qualitätsziel

## Hinweis

Für Detailregeln siehe [../architecture/responsive.md](../architecture/responsive.md) und [../architecture/navigation.md](../architecture/navigation.md).
