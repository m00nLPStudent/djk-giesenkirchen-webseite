# B15.16H – Bestandsanalyse zentrale Kategorienverwaltung

## Status

**BLOCKED – Datenbankgrundlage fehlt.** Es wurde keine Adminroute und keine Fachlogik implementiert. Das SQL-Proposal wurde nicht ausgeführt.

## Ergebnis der Tabellenprüfung

| Fachbereich | Benötigte Stammdatentabelle | Bestand |
| --- | --- | --- |
| News-Kategorien | `news_categories` | Nicht in der dokumentierten Datenbank vorhanden |
| Terminarten | `event_types` | Nicht in der dokumentierten Datenbank vorhanden |
| Download-Kategorien | `download_categories` | Nicht in der dokumentierten Datenbank vorhanden |

Der dedizierte Read-only-Preflight muss diese Aussage vor einer Migration noch gegen die Live-Datenbank bestätigen.

## Heutige Datenquellen

### News

`news.category` und `news.category_key` sind nullable Textfelder. Das Adminformular enthält eine lokale Konstante `NEWS_CATEGORIES`. Es existiert keine Foreign-Key-Beziehung zu einer Kategorientabelle.

### Termine

`events.event_type` ist ein Textfeld. Das Constraint `events_event_type_check` begrenzt die Werte auf `training`, `spiel`, `vereinstermin`, `turnier` und `sonstiges`. Das Formular verwendet zusätzlich die hardcodierte Konstante `EVENT_TYPES`.

### Downloads

Weder `download_categories` noch eine dokumentierte `downloads`-Tabelle ist vorhanden. Deshalb gibt es keine vorhandenen Felder oder Nutzungsrelationen, auf denen das gewünschte Modul sicher aufbauen könnte.

## Warum die Implementierung stoppt

Die drei Verwaltungsseiten benötigen persistente Datensätze, Aktivstatus und Sortierung. Ohne Tabellen wären Formulare und Listen entweder funktionslos oder erneut hardcodiert. Beides widerspricht dem Auftrag. Zusätzlich kann `events.event_type` nicht vollständig administrierbar werden, solange sein CHECK-Constraint nur fünf feste Werte erlaubt.

## Separates Schema-Proposal

`docs/sql/b15-16h-central-categories-schema-proposal.sql` beschreibt drei additive Stammdatentabellen mit ausschließlich den für die geforderten Oberflächen notwendigen Feldern. Es verändert noch keine bestehenden News-, Termin- oder Downloadtabellen und enthält bewusst keine RLS-Policies.

## Vor einer Freigabe zu klären

1. Live-Preflight bestätigt, dass keine gleichwertigen Tabellen unter anderen Namen existieren.
2. Tabellenname `event_types` wird fachlich bestätigt; ältere Analyse-SQL suchte auch nach `event_categories`.
3. Entscheidung, ob News und Termine dauerhaft per stabilem `key` lesen oder später echte Foreign Keys erhalten sollen.
4. Separates Konzept für die Ablösung des CHECK-Constraints auf `events.event_type`; sonst sind neue Terminarten trotz Stammdatentabelle nicht nutzbar.
5. Festlegung des sicheren RLS-Schreibmusters auf Basis der bestehenden Admin-Permissiontabellen.
6. Klärung des zukünftigen Download-Datenmodells. Derzeit kann nur die Kategorietabelle vorbereitet werden.

## Nach Freigabe

Erst nach ausgeführter und geprüfter Migration folgen Repositorys, Verwaltungsrouten, Löschschutz, zentrale Auswahlfelder sowie Core- und UI-Regressionstests in einem separaten Umsetzungsschritt.
