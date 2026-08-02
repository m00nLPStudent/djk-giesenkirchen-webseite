# B14.4B - Contributions UI Refinement

## 1. Ausgangslage

Das Beitragsmodul war funktional, zeigte im manuellen Test aber mehrere UX-
Probleme: schlecht lesbare native Selects, fehlende automatische
Mannschaftszuordnung, unklare Formularlogik, zu hohe Aktionszeilen und nicht
interaktive Kennzahlen.

## 2. Dropdown-Styling

Die Contributions-Selects nutzen jetzt eine lokale Klassenkonstante mit Dark-
Theme fuer das `select` selbst und helle, dunkel beschriftete `option`-Eintraege.
Die Anpassung bleibt auf das Beitragsmodul begrenzt und aendert keine Website-
Selects.

## 3. Spieler-/Saison-Zuordnung

Die Formularoptionen werden serverseitig erweitert. Pro Spieler werden
`seasonAssignments[]` und `primaryAssignmentBySeason` vorbereitet. Datenquelle
sind ausschliesslich `player_team_seasons`, `team_seasons` und `teams`.

## 4. Mannschaftssnapshot

Beim Spieler- oder Saisonwechsel wird der Snapshot im Formular neu aus den
serverseitig vorbereiteten Zuordnungen bestimmt. Genau eine Zuordnung wird
automatisch gesetzt, mehrere bleiben auswaehlbar mit deterministischer
Vorauswahl, keine Zuordnung laesst das Feld leer.

## 5. Beitragstypen

Das sichtbare Label fuer `regular` lautet jetzt `Jahresbeitrag`. Die weiteren
Labels bleiben `Aufnahmegebuehr`, `Nachberechnung`, `Korrektur` und
`Sonderbeitrag`.

## 6. Automatische Titelbelegung

Eine reine Helper-Funktion bildet Beitragstypen auf Standardtitel ab und
entscheidet testbar, ob ein Typwechsel den Titel aktualisieren darf. Eigene
Titel bleiben erhalten, bestehende Edit-Titel werden nicht automatisch ersetzt.

## 7. Actions-Dropdown

Desktop- und Mobile-Ansicht nutzen jetzt ein kompaktes `Aktionen`-Menue statt
einer hohen Linkliste. Das Menue schliesst bei Escape und Aussenklick. Die
Elemente bleiben status- und permissionabhaengig.

## 8. Einklappbarer Filter

Der Filterbereich besitzt einen einklappbaren Kopf mit `aria-expanded`,
Zusammenfassung aktiver Filter und Reset-Link. Die URL-Search-Params bleiben die
einzige Filterquelle.

## 9. Klickbare Kennzahlen

Die Statuskacheln sind jetzt semantische Links auf dieselbe Liste mit
angepassten Search-Params. Saison und andere Fachfilter bleiben erhalten, der
Seitenzaehler springt auf Seite 1.

## 10. URL-Filterlogik

Statuskacheln und normale Filter arbeiten gegen dieselben Search-Params. Dadurch
bleiben Statusfeld, Ueberfaellig-Filter und aktive Kachel synchron.

## 11. Responsive Verhalten

Der Aktionsbutton bleibt mobil vollbreit bedienbar. Das Filterpanel startet ohne
aktive Filter auf Desktop offen und auf Mobile bevorzugt geschlossen. Die
Tabellenfallbacks zeigen fuer leere Snapshots neutral `Keine Mannschaft
hinterlegt`.

## 12. Permissions

Serverseitige Guards bleiben massgeblich. Clientseitig werden nur zulaessige
Aktionen angezeigt; fuer `exempt` und `canceled` werden unzulaessige
Folgeaktionen ausgeblendet.

## 13. Tests

Abgesichert wurden neue Helper fuer Titel, Snapshot-Auswahl, Schnellfilter,
Aktionssichtbarkeit, Select-Styling sowie die serverseitige Spieleroptionsquelle
inklusive N+1-Schutz. Bestehende Contributions-Tests laufen weiterhin gruen.

## 14. Offene Risiken

Ein echter Login-basierter Browser-Check auf mobilem Viewport war im
Terminalkontext nicht vollstaendig moeglich. Das Build-Problem mit Google Fonts
bleibt unveraendert ausserhalb dieses Arbeitspakets.

## 15. Empfohlener naechster Schritt

Einen authentifizierten UI-Durchlauf im Browser mit leerer, einfacher und
mehrfacher Saisonzuordnung nachholen und dabei speziell die Windows-Chrome-
Selectdarstellung sowie das Mobile-Menue prue-fen.

