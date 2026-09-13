# Priority 7 – Cleanup Recovery Plan

Status: **VARIANT B / PRIVATE EXPORT RETAINED / PRIORITY 7 COMPLETE**

Gelöschte Live-Daten lassen sich nach `COMMIT` nicht durch ein glaubwürdiges generisches SQL-Rollback rekonstruieren. Die Recovery-Grenze besteht deshalb aus einem vorab verifizierten Supabase-Backup beziehungsweise PITR und privaten Exporten. Dieses Dokument behauptet nicht, dass Backup/PITR im aktuellen Tarif oder Projekt aktiviert ist; das muss der Betreiber vor jeder Ausführung im Supabase-Dashboard bestätigen.

Für die aktuelle Freigabekette gilt **Variante B – private Exporte**. Ein
konkret wiederherstellbarer Backup-/PITR-Punkt ist nicht automatisch
nachgewiesen. Ein später manuell bestätigtes geeignetes Supabase-Backup darf
zusätzlich verwendet werden, ersetzt den aktuell gewählten Exportvertrag aber
nicht ohne erneute dokumentierte Freigabe.

Privates Ziel: `.local/priority7-backup/`. Die bestehende Ignore-Regel
`/.local/` schützt das gesamte Ziel vor versehentlicher Versionierung. Der
private Export wurde vor dem Core-Cleanup abgeschlossen; Verzeichnis, Dump und
Manifest bleiben unversioniert.

## Verpflichtende Vorbereitung

1. Verfügbarkeit, Aufbewahrungsfenster und Wiederherstellungsverfahren von Supabase Backup/PITR prüfen.
2. Wiederherstellbaren Snapshot unmittelbar vor dem Cleanup dokumentieren.
3. Alle freigegebenen Delete-Tabellen vollständig in einen privaten, nicht versionierten Export sichern.
4. P7.01–P7.22, die Dry-run-Counts und die unveränderte Rollen-/Permission-/Department-Baseline sichern.
5. Die technische Keep-Superadmin-ID aus P7.03 privat sichern; keine E-Mail, Tokens oder Credentials dokumentieren.
6. Das Storage-Manifest P7S.01–P7S.03 privat exportieren und Objektpfade vor einer separaten Storage-Löschung verifizieren.
7. Die bereits finalen P7D.01–P7D.08-Entscheidungen und Counts als privaten Ausführungsnachweis sichern.
8. Cleanup-Zeitpunkt, verantwortlichen Operator und ausgeführte Artefaktversion/Commit dokumentieren.

Jede der 31 Core-Tabellen wird vollständig und separat exportiert. Die Exporte
müssen alle Spalten und damit Primary Keys, Foreign Keys und Zeitstempel
enthalten. Zusätzlich werden ein Manifest mit Tabellenname, Zeilenzahl,
Exportzeitpunkt und Dateiprüfsumme sowie die P7DR.01–P7DR.07-Resultsets privat
gesichert. Die Wiederherstellungsreihenfolge ist die umgekehrte, anhand der
FK-Metadaten validierte Delete-Reihenfolge; Constraints werden nicht
deaktiviert. Notification Audit und MUST-KEEP-Foundation sind keine
Delete-Exports, ihre Counts werden jedoch als unveränderte Kontrollbaseline
gesichert.

## Ausführungs- und Recovery-Grenzen

- Das Core-SQL wurde nach abgeschlossenem privatem Export als einzelne Transaktion erfolgreich ausgeführt; der anschließende Postcheck ist bestanden. Bei einem Guard-/Statementfehler hätte die Transaktion automatisch zurückgerollt.
- Nicht-Superadmin-Auth-User werden nach gesonderter Freigabe über die serverseitige Supabase Admin API entfernt, nicht durch direktes SQL auf `auth.users`.
- Storage-Objekte werden erst nach erfolgreichem DB-Manifest-Abgleich über einen kontrollierten Storage-API-Lauf entfernt. Buckets bleiben bestehen.
- Tritt nach einem erfolgreichen Commit ein Fehler auf, erfolgt Recovery ausschließlich aus dem verifizierten Backup/PITR beziehungsweise den privaten Tabellen- und Storage-Manifest-Exporten.
- Vor Restore keine improvisierten Teil-Inserts oder FK-Deaktivierungen durchführen.

## Finaler Abschluss

Core-, Auth- und Media-/Storage-Cleanup sowie Public Repair sind abgeschlossen.
Der finale Read-only-Gesamtpostcheck und die manuellen Login-, Profil- und
Public-Smoke-Gates sind bestanden. Der private Dump und die privaten Manifeste
bleiben ausschließlich unter `.local/` und werden nicht versioniert. Eine
Wiederherstellung ist aktuell nicht erforderlich.

## Stop-Bedingungen

- Backup/PITR oder vollständige private Exporte sind nicht verifiziert.
- Keep-Superadmin-ID ist nicht eindeutig oder weicht von P7.03 ab.
- Counts oder Foundation-Fingerprints sind seit dem Preflight verändert.
- Storage-Manifest enthält nicht zuordenbare Objekte oder widersprüchliche Pfade.
- Proposal oder Ausführungsplan weicht von den final dokumentierten Operatorentscheidungen ab.
- Der Superadmin-Avatar ist kein Recovery-Gate. Vor dem späteren Media-Schritt
  müssen aber Avatar-FK und `admin_profile`/`avatar`-Usage im privaten Manifest
  nachgewiesen und kontrolliert entkoppelt werden.
