# B13.2 - Live-Datenbankinventur

## Zweck des Live-Audits

Dieses Dokument beschreibt die Ausfuehrung einer Live-Inventur des tatsaechlichen Ist-Stands der produktiven Supabase-PostgreSQL-Datenbank.

Die dazugehoerige Datei [docs/sql/b13-live-database-audit.sql](docs/sql/b13-live-database-audit.sql) enthaelt ausschliesslich read-only Abfragen.

## Ausfuehrungsanleitung

1. Supabase im Browser oeffnen.
2. SQL Editor oeffnen.
3. Inhalt von [docs/sql/b13-live-database-audit.sql](docs/sql/b13-live-database-audit.sql) vollstaendig einfuegen.
4. Abfragen blockweise ausfuehren (Block fuer Block in der Reihenfolge 01 bis 12).
5. Ergebnisse je Block als CSV oder JSON exportieren.
6. Exportdateien eindeutig benennen.

Empfohlene Dateinamen:

- b13-01-tables.csv
- b13-02-columns.csv
- b13-03-constraints.csv
- b13-04-foreign-keys.csv
- b13-05-indexes.csv
- b13-06-triggers.csv
- b13-07-functions.csv
- b13-08-views.csv
- b13-09-rls-policies.csv
- b13-10-storage-buckets.csv
- b13-11-storage-summary.csv

Hinweis: Falls JSON genutzt wird, die gleichen Dateinamen mit `.json` verwenden.

## Erwartete Ergebnisbloecke

- 01 Tabelleninventur (public, auth, storage; inkl. Groessen und RLS-Status)
- 02 Spalteninventur (public)
- 03 Constraints (public)
- 04 Foreign Keys (public, mehrspaltig aufgeloest)
- 05 Indizes (public)
- 06 Trigger (public, ohne interne Constraint-Trigger)
- 07 Funktionen/RPCs (public)
- 08 Views und Materialized Views (public, auth, storage)
- 09 RLS-Policies (public, storage)
- 10 RLS-Status je Tabelle (public, storage)
- 11 Storage-Buckets
- 12 Storage-Objekt-Summary (aggregiert)

## Read-Only-Hinweis

Die SQL-Datei [docs/sql/b13-live-database-audit.sql](docs/sql/b13-live-database-audit.sql) enthaelt nur SELECT-Abfragen (inkl. WITH ... SELECT) und keine mutierenden Statements.

## Checkliste fuer Ergebnis-Export

- Block 01 exportiert
- Block 02 exportiert
- Block 03 exportiert
- Block 04 exportiert
- Block 05 exportiert
- Block 06 exportiert
- Block 07 exportiert
- Block 08 exportiert
- Block 09 exportiert
- Block 10 exportiert
- Block 11 exportiert
- Block 12 exportiert
- Dateinamen gemaess Konvention vergeben
- Exportformat (CSV oder JSON) je Datei dokumentiert
- Exportzeitpunkt dokumentiert

## Platzhalter fuer spaetere Bewertung

Noch keine fachliche Bereinigung in diesem Schritt.

Platz fuer Bewertung nach Live-Ausgabe:

- Tabellenbewertung: TODO
- Spaltenbewertung: TODO
- Constraint-/FK-Bewertung: TODO
- Index-Bewertung: TODO
- Trigger-/Funktions-Bewertung: TODO
- RLS-/Policy-Bewertung: TODO
- Storage-Bewertung: TODO
