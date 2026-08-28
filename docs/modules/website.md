# Modul: Website

## Status

Der funktionale Responsive Release ist abgeschlossen. B15.24A hat 30 öffentliche Seiten und zwei Handler inventarisiert. B15.24B steht auf **IMPLEMENTED / PARTIAL MANUAL REVIEW COMPLETE / REMAINING WEBSITE REVIEW PENDING**: Gesamtvereinsstruktur, alle vier Abteilungen, zugängliche Desktop-/Mobilnavigation, Floating-Navigation, Header/Footer, dynamische Startseite, globale Top-5-Trainingstermine, lokale Sportassets und kontrollierte Aufbau-Routen sind implementiert. Der bearbeitete Header-/Navigations-/Startseitenbereich wurde teilweise manuell geprüft. Der restliche visuelle Browser-/Designreview der öffentlichen Website wird im nächsten Arbeitsschritt fortgesetzt. Der vollständige Befund und Umsetzungsstand stehen unter [`../planning/b15-24a-public-website-inventory.md`](../planning/b15-24a-public-website-inventory.md).

Die Website behandelt Fußball, Tischtennis, Behindertensport und Gymnastikdamen als Abteilungen desselben Gesamtvereins. Die bestätigte Grundrichtung bleibt dunkel, modern und sportlich mit Rot/Schwarz/Weiß; helle Karten und kleine Weißflächen lockern gezielt auf. Eine externe Referenz für spätere Detailarbeit steht weiterhin aus.

## Öffentliche Kernbereiche

- Startseite mit News-Hauptbereich und fünf kommenden, automatisch aus den bestehenden Trainingszeiten erzeugten Trainingsterminen
- Vereinsübersichtsseite `/verein`
- News-Übersicht und News-Detailseiten
- Termine-Bereich mit allgemeinen Terminen und virtuellen Trainings
- Fußball-Übersichtsseite und Mannschaftsseiten
- Abteilungsseiten und Aufbau-Einstiege für Fußball, Tischtennis, Behindertensport und Gymnastikdamen
- Sponsorenübersicht
- Vereinsgeschichte
- Kontaktseite
- Impressum
- Datenschutz
- Mitglied-werden-Seite

## Umgesetzte Querschnittsfunktionen

- dynamischer Footer
- Navigation mit hover-/klick-/tastaturfähigen Desktop-Disclosure-Menüs, Active States und mobilen Untermenü-Akkordeons
- zentral verwendete öffentliche Logo-Konfiguration ohne neues DB-Feld
- Pages-CMS-Anbindung über `pages`
- Vereinsdaten aus `club_settings`
- Kontaktdaten aus `club_contacts`

## Responsive

- mobile-first über alle öffentlichen Seiten
- historisch auf 360, 375, 390, 414, 768, 1024 und Desktop validiert; nach der B15.24-Überarbeitung ist eine neue reale Geräte-/Browserabnahme erforderlich
- kein horizontales Seitenscrolling als Qualitätsziel

## Hinweis

Für Detailregeln siehe [../architecture/responsive.md](../architecture/responsive.md) und [../architecture/navigation.md](../architecture/navigation.md).

Offen bleiben ein administrativ pflegbares Logo nach separatem Settings-/Daten-Preflight, eine offizielle myTischtennis.de-Widget-/Embed-/API-Prüfung, echte fachliche Inhalte für die neuen Aufbau-Seiten sowie eine reale Consent-Steuerung. AGB werden nur verlinkt, wenn eine entsprechende CMS-Seite tatsächlich publiziert ist.
