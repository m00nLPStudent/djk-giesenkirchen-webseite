# B15.16H1 – Datenbankgrundlage zentrale Kategorien

## 1. Live-Preflight

Der Live-Preflight konnte in dieser Arbeitsumgebung nicht gegen Supabase ausgeführt werden. Der Ausführungsstatus ist deshalb **BLOCKED**. Die vorhandene Datenbankdokumentation wurde vollständig statisch ausgewertet.

## 2. Bestätigte Tabellenlücken

Im dokumentierten Stand fehlen `news_categories`, `event_types`, `event_categories`, `download_categories` und ein allgemeines Download-Fachmodell. Der Live-Preflight muss dies bestätigen.

## 3. Namensentscheidung

`event_types` ist verbindlich vorgesehen. Die Werte `training`, `spiel` und `vereinstermin` sind technische Typen, keine redaktionellen Kategorien. Eine parallele Tabelle `event_categories` wird nicht erstellt.

## 4. Gemeinsames Schema

Alle Tabellen erhalten UUID, normalisierten eindeutigen `key`, deutsches `name_de`, `is_active`, `sort_order`, `created_at` und `updated_at`. `event_types` besitzt zusätzlich `is_system`.

## 5. Event-Systemtypen

Alle fünf vom bestehenden CHECK-Constraint zugelassenen Keys werden als Systemtypen angelegt. Dadurch bleiben bestehende Datensätze und Formwerte stabil. `training` ist zusätzlich durch virtuelle Mannschaftstrainings fest verdrahtet. Ein Trigger verhindert Löschen, Deaktivieren, Entschützen und Key-Änderungen; das Label bleibt bearbeitbar.

## 6. RLS-Modell

Aktive Stammdaten sind öffentlich lesbar. Authentifizierte Administratoren mit aktivem Profil und `settings.edit` beziehungsweise Superadmin-Bypass lesen auch inaktive Daten und dürfen schreiben. Die Profilauflösung entspricht G3: `auth.uid()` mit bestehendem E-Mail-Fallback. Es gibt keine `app_metadata.role`-Prüfung und keine offene Write-Policy.

## 7. News-Bestandswerte

Statisch bekannte Codewerte: `allgemein`, `verein`, `fussball`, `tischtennis`, `damen-gymnastik`, `testessen`, `sonstiges`. Livewerte sind unbekannt. Das Seed-Proposal übernimmt vorhandene normalisierte `category_key`-Werte ohne Überschreiben und bricht bei fehlenden oder ungültigen Keys ab.

## 8. Event-Bestandswerte

Dokumentiert sind `vereinstermin`, `training`, `spiel`, `turnier`, `sonstiges`. Das aktuelle Constraint lautet sinngemäß `event_type = ANY (ARRAY['training','spiel','vereinstermin','turnier','sonstiges'])`.

## 9. Download-Startwerte

Vorgeschlagen sind `mitgliedschaft`, `formulare`, `satzung`, `beitragsordnung`, `jugend`, `sonstiges`. Diese Liste benötigt vor Ausführung fachliche Freigabe.

## 10. Bewusst fehlende Fach-FKs

H1 ergänzt keine Spalte und keinen Foreign Key an `news` oder `events`. Auch `events_event_type_check` und vorhandene Textwerte bleiben unverändert.

## 11. SQL-Reihenfolge

1. Read-only-Preflight ausführen und sichern.
2. Prüfen, dass die drei Zieltabellen fehlen und `public.set_updated_at()` vorhanden ist.
3. Schema-Proposal ausführen.
4. Seed-Inventar mit den Livewerten abgleichen; Downloadwerte fachlich freigeben.
5. Seed-Proposal ausführen.
6. Read-only-Postcheck ausführen.

## 12. Postcheck

Der Postcheck inventarisiert Tabellen, Spalten, Constraints, Indizes, Trigger, RLS, Policies und Seeds. Eine separate Abfrage muss für offene Write- oder `app_metadata`-Policies null Zeilen liefern.

## 13. Rollback

Der Rollback entfernt nur H1-Tabellen und die H1-Systemtypfunktion. Sobald spätere Foreign Keys auf eine Tabelle zeigen, bricht er vor jeder Löschung ab.

## 14. Go-/No-Go-Kriterien

Go nur bei bestätigten Tabellenlücken, vorhandenem `set_updated_at()`-Helper, vollständig ausgewerteten News-/Eventwerten, freigegebenen Downloadwerten und geprüfter G3-RLS-Kompatibilität. Jede Abweichung bedeutet No-Go.

## 15. Risiken

Livewerte können von der Dokumentation abweichen. Newszeilen ohne eindeutigen technischen Key benötigen manuelle Zuordnung. Die bestehenden offenen Policies anderer Module sind kein Vorbild. H1 stellt noch keine dynamischen Formauswahlen bereit.

## 16. Nächste Teilphasen

H2 sollte zuerst die drei Verwaltungsoberflächen aufbauen. H3 sollte danach News und Termine kontrolliert anbinden, einschließlich Constraintstrategie, Backfill-Konzept, Löschschutz und Regressionen. Ein allgemeines Downloadmodul bleibt ein eigenes Facharbeitspaket.
