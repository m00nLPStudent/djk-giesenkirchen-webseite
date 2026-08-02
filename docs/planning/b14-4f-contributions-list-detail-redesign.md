# B14.4F Contributions List Detail Redesign

## 1. Ausgangslage

Die Contributions-Uebersicht war bereits deutlich kompakter, zeigte aber noch
eine zusaetzliche Schnellfilter-Leiste und mehr Listeninformation als fuer eine
reine Auswahlseite noetig.

## 2. Entfernte Schnellfilter

Die komplette Status-Chip-Leiste wurde entfernt. Statusfilter werden jetzt nur
noch ueber den einklappbaren Filterbereich gesetzt. Entfernt wurden damit auch
die zugehoerigen Quick-Filter-Helper und Tests.

## 3. Neue Uebersicht

Die Uebersicht ist jetzt eine reine Auswahlseite:

- kompakter Seitenkopf
- Geldsummen-Leiste
- Filter-Disclosure
- reduzierte Liste

## 4. Geldsummen

Die Geldsummen bleiben als kompakte gemeinsame Leiste erhalten:

- Soll
- Gezahlt
- Erlassen
- Offen

`Offen` ist weiterhin leicht hervorgehoben.

## 5. Filter

Der Filterbereich bleibt standardmaessig geschlossen, URL-basiert und ist jetzt
die einzige Filteroberflaeche. Im geschlossenen Zustand bleiben nur Icon,
Titel, optionaler Badge und Chevron sichtbar.

## 6. Desktopliste

Die Desktopliste wurde auf vier Spalten reduziert:

- Spieler
- Status
- Offen
- Uebersicht

Dadurch entfallen Mannschaft, Saison und Faelligkeit aus der Auswahlansicht.
Die Tabelle kann deshalb schon ab `lg` stabil angezeigt werden.

## 7. Mobile Liste

Die mobile Karte zeigt nur noch:

- Spielername
- Status
- offenen Betrag
- Chevron

Alle weiteren Fachinformationen wandern auf die Detailseite.

## 8. Neue Detailseite

Die Detailseite wurde als eigentlicher Arbeitsbereich neu gegliedert:

- kompakter Kopf mit Spieler, Metazeile, Status und Primaeraktionen
- gemeinsame Betragsleiste
- Beitragsinformationen als kompakte Definitionsliste
- Zahlungsverlauf
- Sonderstatus
- restliche Aktionen

## 9. Betragsleiste

Soll, Gezahlt, Erlassen und Offen werden in einem gemeinsamen kompakten
Container dargestellt. Dieselbe visuelle Sprache wird in Uebersicht und Detail
verwendet.

## 10. Beitragsinformationen

Die Detailinformationen werden jetzt als dichte 2-Spalten-Definitionsliste
dargestellt statt als viele Einzelkarten. Enthalten bleiben Titel, Typ, Saison,
Mannschaft, Faelligkeit, Ratenzahlungsinformationen und interne Notizen.

## 11. Zahlungshistorie

Zahlungen erscheinen auf Desktop in einer kompakten Tabellenansicht und auf
kleineren Breiten als Kartenliste. Gebuchte Zahlungen koennen weiterhin direkt
von dort storniert werden, wenn die Permission vorliegt.

## 12. Aktionen

Primaeraktionen sitzen im Kopf:

- Zahlung erfassen
- Bearbeiten

Sekundaere und gefaehrliche Aktionen bleiben in einem separaten Aktionsbereich:

- Stundung
- Stundung aufheben
- Befreien
- Beitrag stornieren

## 13. Sonderstatus

Stundung, Befreiung und Storno werden nur noch gezeigt, wenn zum Beitrag
tatsaechlich relevante Sonderstatusdaten vorliegen. Leere Platzhalterflaechen
entfallen.

## 14. Permissions

Server-Guards und Permission-Keys bleiben unveraendert. Vorstand bleibt
read-only, waehrend Superadmin und Kassierer ihre freigegebenen Aktionen
behalten.

## 15. Responsive

- `lg` und groesser: reduzierte Desktoptabelle in der Uebersicht
- unter `lg`: mobile Auswahlkarten
- Detailseite: einspaltig auf kleineren Breiten, zweispaltig ab breitem Desktop
- Zahlungsverlauf: Tabelle auf Desktop, Karten auf kleineren Breiten

## 16. Tests

Abgesichert wurden Helper-Tests fuer:

- reduzierte Uebersichtsspalten und Breakpoint
- Geldsummen der Uebersicht und Detailseite
- kompakte Detail-Metadaten und Infofelder
- bedarfsorientierte Sonderstatus-Bereiche
- bestehende UI-State- und Filter-Logik

## 17. Offene Risiken

- Ein echter visueller Test mit Admin-Session fehlt weiterhin.
- Projektweite Lintfehler ausserhalb des Contributions-Bereichs bleiben bestehen.
- Der Build scheitert in dieser Umgebung weiterhin an externem Google-Font-Fetch.

## 18. Empfohlener naechster Schritt

Die neue Auswahlseite und die neu strukturierte Detailseite einmal mit realen
Beitragsdaten im Browser pruefen, besonders fuer read-only Vorstand, stornierte
Zahlungen und sehr lange Spielernamen.
