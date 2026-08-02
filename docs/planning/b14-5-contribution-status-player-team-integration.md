# B14.5 Contribution Status Player Team Integration

## 1. Ziel

Der Beitragsstatus der aktuellen Saison wird in die Adminbereiche fuer Spieler
und Mannschaften integriert, ohne das bestehende Contributions-Modul fachlich zu
duplizieren oder oeffentliche Seiten zu beruehren.

## 2. Rollenmodell

- `superadmin`: volle Sicht inklusive Link ins Contributions-Modul
- `kassierer`: unveraendertes Contributions-Modul, Player-/Team-Sichten nur bei
  bestehendem Modulzugriff
- `vorstand`: read-only mit Status, Betraegen und Detaillink
- `jugendleiter`: scoped Sicht fuer Jugendbereiche, kein globaler
  Contributions-Zugriff
- `trainer`: scoped Sicht fuer eigene Mannschaften, read-only
- `betreuer` und `gast`: kein Beitragsstatus ohne explizites globales
  Contributions-Recht

Ein separater Rollen-Key `jugendkoordinator` existiert im aktuellen Codebestand
nicht; die Jugend-Scope-Logik laeuft derzeit ueber `jugendleiter`.

## 3. Scope-Modell

Es wurde kein neuer Permission-Key eingefuehrt. Stattdessen basiert die neue
Sichtbarkeit auf der vorhandenen Scope-Engine:

- globale Detailsicht ueber bestehendes `contributions.view`
- scoped Statussicht fuer `jugendleiter` und `trainer`
- Team- und Personenscopes werden weiter aus den vorhandenen Teamzuordnungen und
  Rollen-Scope-Typen abgeleitet

Die serverseitigen Abfragen werden erst nach Scope-Pruefung mit den bereits
sichtbaren Player- oder Team-IDs ausgefuehrt.

## 4. Datenminimierung

Fuer Player- und Teamoberflaechen wird nur ein reduziertes Status-Dataset
geladen:

- `playerId`
- `contributionId`
- `seasonId`
- `status`
- `displayStatus`
- `amountDue`
- `amountPaid`
- `amountOutstanding`
- `dueDate`
- `isOverdue`
- `hasContribution`

Nicht geladen oder weitergereicht werden interne Notizen, Gruende,
Zahlungsreferenzen, Zahlungsverlaeufe oder Actor-IDs.

## 5. Aktuelle Saison

Die Statusintegration verwendet ausschliesslich `seasons.is_current = true`.
Fehlt eine aktuelle Saison oder sind mehrere markiert, werden keine
Beitragsdaten geraten. Stattdessen zeigen die betroffenen Adminseiten einen
klaren Warnzustand.

## 6. Statusmapping

Verwendet wird das bestehende Contributions-Statusmapping:

- `open`
- `partially_paid`
- `paid`
- `deferred`
- `exempt`
- `canceled`

Ergaenzt wurde nur der UI-Zustand `none -> Kein Beitrag`. `Ueberfaellig`
bleibt ein zusaetzlicher Warnbadge und ist kein neuer DB-Status.

## 7. Spieleruebersicht

Die Spielerliste wurde in eine kompaktere Uebersicht umgebaut:

- Desktopliste mit Spieler, Mannschaft, Aktivstatus, Vereinsbeitrag, offenem
  Betrag und Detailpfeil
- mobile Karten mit denselben Kerninformationen
- Beitragsstatus nur fuer berechtigte Rollen
- optionaler Beitragsfilter in der vorhandenen Filteroberflaeche

Ohne Beitragsberechtigung wird keine Contributions-Spalte gerendert.

## 8. Spieler-Detailseite

Neu ist eine Admin-Detailroute `/admin/players/[id]` als Hauptarbeitsbereich.
Sie zeigt:

- Spielername
- Mannschaften
- Aktivstatus
- Beitragsstatus
- kompakte Beitragsleiste

`trainer` sehen nur Status, offen und Faelligkeit. Rollen mit
`contributions.view` erhalten zusaetzlich Soll, Gezahlt und den Link
`Beitrag oeffnen`.

## 9. Mannschaftsuebersicht

Die Teamliste wurde auf kompakte Detailpanels umgestellt. Je Mannschaft kann
jetzt eine serverseitig berechnete Beitragszusammenfassung erscheinen:

- Spieler gesamt
- bezahlt
- teilweise bezahlt
- offen
- ueberfaellig
- kein Beitrag
- offener Gesamtbetrag

Ohne Berechtigung bleibt die Teamliste bei den allgemeinen Teamkennzahlen.

## 10. Mannschafts-Detailseite

Neu ist die Admin-Detailroute `/admin/teams/[id]` mit einem Abschnitt
`Vereinsbeitraege`. Dort erscheinen alle Spieler der Mannschaft in einer
kompakten read-only Liste mit:

- Spieler
- Beitragsstatus
- Soll
- Gezahlt
- Offen
- Faelligkeit
- Detailpfeil zur Spielerseite

Es werden keine Zahlungsdetails und keine Mutationsbuttons fuer Trainer,
Jugendleiter oder Vorstand angezeigt.

## 11. Team-Summary

Die Team-Zusammenfassung wird serverseitig aus den reduzierten Player-Status-Daten
gebildet und enthaelt:

- `teamId`
- `seasonId`
- `playerCount`
- `contributionCount`
- `paidCount`
- `partiallyPaidCount`
- `openCount`
- `deferredCount`
- `exemptCount`
- `overdueCount`
- `missingContributionCount`
- `totalDue`
- `totalPaid`
- `totalOutstanding`

Die Berechnung laeuft ohne N+1 ueber Batch-Abfragen fuer Teamzuordnungen und
Contribution-Zeilen.

## 12. DTOs

Neu hinzugekommen sind:

- reduziertes Player-Contribution-Status-DTO
- Team-Contribution-Summary-DTO

Mehrere Contribution-Positionen derselben Saison werden serverseitig eindeutig
verdichtet:

- aktiver `regular`-Beitrag hat Prioritaet
- mehrere aktive `regular`-Beitraege liefern einen Warncode
- ohne `regular` werden aktive, nicht stornierte Sonderpositionen aggregiert
- rein stornierte Positionen bleiben als `Storniert` sichtbar, zaehlen aber
  nicht als offen

## 13. Repository

Neu ist ein reduziertes Repository fuer:

- Contribution-Statuszeilen je `playerIds + seasonId`
- Team-Spielerzuordnungen je `teamIds + seasonId`

Damit bleiben die Pages bei maximal einer Batch-Abfrage fuer Zuweisungen und
einer Batch-Abfrage fuer Contributions.

## 14. Permissions

Ein neuer Permission-Key war nicht noetig. Die bestehende Architektur reicht:

- globales `contributions.view` fuer Detaillinks und volle Sicht
- scoped read-only Sicht aus vorhandenen Team-/Jugendscopes

Deshalb wurde bewusst keine neue SQL-Proposal-Datei erzeugt.

## 15. Datenschutz

Trainer und Jugendleiter erhalten nur den kompakten Statuskontext:

- Status
- Soll
- Gezahlt
- Offen
- Faelligkeit

Nicht sichtbar sind Gruende, Notizen, Zahlungsverlaeufe, Referenzen und
Actor-Daten. Oeffentliche Routen wurden nicht geaendert.

## 16. Responsive Design

- Player- und Teamlisten schalten auf kompakte Mobile-Karten zurueck
- Player- und Teamdetails nutzen lokale breite Container
- Beitragsleisten und Team-Summaries brechen in mehrspaltige Segmente um
- keine inneren Desktop-Scrollcontainer fuer die kompakten Uebersichten

## 17. Tests

Erweitert wurden gezielte Tests fuer:

- scoped Sichtbarkeit
- Aggregation mehrerer Contribution-Positionen
- Warnzustand bei doppeltem `regular`
- Team-Summary-Zaehlung
- Player-Filter fuer Beitragsstatus und Ueberfaelligkeit

Gezieltes ESLint fuer die geaenderten Dateien laeuft ebenfalls sauber.

## 18. Offene Risiken

- Es gibt noch keine echten Browser-Rollentests mit Trainer- oder
  Jugendleiter-Session.
- Die Player-Freitextsuche bleibt bewusst lokal im Client und wird nicht als
  Querystring persistiert.
- Teamlistenfilter fuer offene oder fehlende Beitraege wurden bewusst
  verschoben.
- Projektweite Lintfehler ausserhalb dieses Bereichs bleiben bestehen.
- Der Produktionsbuild kann in dieser Umgebung weiter am externen
  Google-Font-Fetch scheitern.

## 19. Empfohlener naechster Schritt

Die neuen Player- und Teamdetails einmal mit echten Rollen im Browser pruefen,
insbesondere:

- Trainer mit eigener Mannschaft
- Jugendleiter im Jugendbereich
- Vorstand read-only
- Spieler ohne Beitrag
- doppelte `regular`-Faelle
