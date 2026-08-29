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
- kompakte Desktop-Serviceleiste mit dem zentral konfigurierten Instagram-Ziel sowie Kontakt-/Anfahrts- und Termin-Quicklinks; auf kleineren Viewports bewusst ausgeblendet
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

Der Footer gliedert sich responsiv in Vereinspräsentation, Verein, Sportarten, weitere interne Links und Kontakt. Vereins-/Kontaktdaten und Social Links stammen aus `club_settings`; ein gemeinsamer Resolver validiert die vorhandenen Keys Facebook, Instagram, YouTube, TikTok, LinkedIn und X für Header und Footer. Rechtlinks für Impressum und Datenschutz erscheinen nur bei publiziertem Inhalt. `/cookie-einstellungen` ist als ehrliche Aufbau-Route ohne Fake-Toggles verlinkt; die reale Consent-Steuerung bleibt offen. `/anfahrt` bezieht Adresse und Google-Maps-Ziel ebenfalls zentral aus `club_settings`; externe Karteninhalte werden nie automatisch geladen. Offen bleiben außerdem ein administrativ pflegbares Logo nach separatem Settings-/Daten-Preflight, eine offizielle myTischtennis.de-Widget-/Embed-/API-Prüfung, echte fachliche Inhalte für die neuen Aufbau-Seiten, verifizierte externe Verbands-/Ortslinks, Vereinsregisterdaten und AGB. NewsCards bleiben unverändert.

Nach manuellem Designreview verwenden die Social Glyphs keine originalfarbigen Markenflächen, sondern dieselben transparenten roten Icon-Tokens wie Standort und Kalender. Eine zukünftige interaktive Karte verwendet die offizielle Google Maps Embed API und die zentrale Vereinsadresse. Der serverseitige Konfigurationsname ist `GOOGLE_MAPS_EMBED_API_KEY`; es wird kein Wert im Repository hinterlegt. Der Key muss in Google Cloud auf die benötigte API und zulässige Website-Referrer beschränkt werden. Ohne gültige Konfiguration wird kein iframe erzeugt. Mit Konfiguration lädt die Kartenkomponente Google erst nach bewusstem Klick; die spätere persistente Entscheidung wird der noch offenen Consent-Verwaltung überlassen. Google Maps Inline/Embed und die echte Cookie-/Consent-Verwaltung sind verbindliche separate Folgeblöcke; `/cookie-einstellungen` bleibt bis dahin eine transparente Aufbau-Route ohne Steuerung.

Die Rot-/Hover-Tokens liegen direkt auf den `currentColor`-SVGs. So bleiben sie trotz der globalen vererbenden Linkfarbe in Header und Footer zuverlässig rot.
