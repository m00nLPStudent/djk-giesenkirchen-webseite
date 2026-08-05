# B15.18J1 – Supabase-Beitragsdispatcher

## 1. Ziel

Der produktionsfähige, aber noch nicht aktivierte Dispatcher liest offene Vereinsbeiträge und erzeugt ausschließlich über die zentrale Notification-Infrastruktur Erinnerungen. Beitragsdaten werden niemals mutiert.

## 2. Verbindliche Fristen

Zentral in `CONTRIBUTION_REMINDER_POLICY`: 14 und 7 Kalendertage vorher, am Fälligkeitstag, 7 Tage danach sowie ab Tag 21 alle 14 Tage. Zwischenstufen erzeugen kein Ereignis.

## 3. Europe/Berlin

Supabase-Datenbanken laufen standardmäßig in UTC. Cron ruft daher stündlich zur vollen Stunde auf. Der Route Handler entscheidet serverseitig mit `Intl.DateTimeFormat` und `Europe/Berlin`, ob lokal Stunde 08 erreicht ist. Damit gelten CET und CEST ohne saisonale Cronänderung.

## 4. Supabase-Scheduleranalyse

Im Repository existieren keine Edge Functions und keine Cronkonvention. Supabase unterstützt `pg_cron`, HTTP-Aufrufe über `pg_net` und verschlüsselte Werte in Vault. Die bestehende Notification- und Beitragslogik liegt in Next.js; eine SQL-Neuimplementierung wäre eine zweite Fachlogik.

## 5. Gewählte Schedulerarchitektur

Variante B: Supabase Cron → `pg_net` → `POST /api/internal/contribution-reminders`. Die dauerhaft erreichbare Hosting-URL liegt als Vault-Secret vor. `GET` ist nicht implementiert und ergibt 405.

## 6. Secret-Schutz

Secretname im Hosting: `CONTRIBUTION_REMINDER_CRON_SECRET`. In Supabase Vault: `contribution_reminder_cron_secret`; zusätzlich `contribution_reminder_endpoint`. Der Header lautet `Authorization: Bearer <secret>` und wird konstantzeitlich geprüft. Fehlend/falsch: 401, kein Dispatcherzugriff. Rotation: neuen identischen Wert zuerst im Hosting, dann im Vault setzen und den negativen/positiven Test wiederholen. Kein Wert wird committed.

## 7. Idempotenzhärtung

Der finale partielle Unique Index umfasst Empfänger, Typ und `metadata.idempotencyKey`. Der Key enthält Typ, contributionId, recipientUserId, Stufe, Geschäftsdatum und Beitragsjahr. Der Fünf-Minuten-Preflight bleibt als Optimierung; die Datenbankgrenze entscheidet atomar. SQLSTATE 23505 für genau diesen Index wird als Duplicate gezählt, andere Fehler bleiben Fehler.

## 8. Duplicate-Preflight

Der read-only Preflight gruppiert ohne Nachrichtentext nach Key, Empfänger und Typ und zeigt Anzahl sowie früheste/späteste Zeit. Liefert er Zeilen, muss vor Indexanlage gestoppt werden. Bereinigung erfordert eine separate Freigabe; dieses Paket löscht nichts.

## 9. Repository

`contributionReminder.repository.js` liest relevante Statuswerte mit ID-Cursor in 100er-Chunks. Spieler, Team-Saisons und aktive Spielerzuordnungen werden je Chunk gebündelt geladen. Abgerufen werden nur ID, Name, Saison, Status, Termine und Summenfelder; keine Notizen, Zahlungsreferenzen oder Zahlungsarten.

## 10. Dispatcher

Der Service erzeugt runId und Zähler, lädt Finanzempfänger einmalig, klassifiziert jeden Chunk, löst alle darin benötigten Trainer gemeinsam auf, baut getrennte Payloads und ruft `createNotificationsOnce` auf. Ein Benutzer mit Finanzrolle erhält die Finanzvariante statt zusätzlich einer Trainervariante.

## 11. Klassifikation

Maßgeblich sind `due_date`, Status, `deferred_until` und der fachlich vorhandene Restbetrag. Archivierung eines Mitglieds löscht keine offene Forderung und ist deshalb allein kein Ausschlussgrund.

## 12. Teilzahlungen

Ein positiver Restbetrag bei `partially_paid` verwendet `membership_payment_partial_open`; vollständig ausgeglichene Forderungen erzeugen nichts.

## 13. Stundungen

Vor `deferred_until` wird unterdrückt, am Enddatum genau `membership_payment_deferral_ending` erzeugt. Danach bleibt mangels anderslautender Modellregel das ursprüngliche `due_date` maßgeblich. Dieser fachliche Punkt bleibt PARTIAL; am Stundungsendtag entsteht keine zweite Meldung.

## 14. Empfänger

Finanzempfänger stammen unverändert aus dem vorhandenen Resolver: aktive Superadmins, Kassierer und Vorstände mit `contributions.view`. Trainer, Co-Trainer und Betreuer stammen ausschließlich aus aktiven Zuordnungen der beitragsbezogenen Saison und dem vorhandenen Teamresolver.

## 15. Datenschutz

Trainertexte enthalten Name und neutralen Offenstatus, aber keine Beträge, Mahnstufen, Zahlungsarten oder Stundungsdetails. Audit, Cronantwort und Idempotenzschlüssel enthalten keine Namen oder Finanzwerte.

## 16. Preferences

Der Dispatcher implementiert keinen eigenen Filter. Die zentralen optionalen, standardmäßig aktiven Beitrags-Preferences werden in `createNotificationsOnce` angewendet; Skips fließen in Audit und Laufbericht.

## 17. Audit

Jede Notification nutzt das bestehende persistente Audit. Zusätzlich wird eine technische Zeile `contribution_reminder_dispatch` mit Laufzählern, Stufen, Laufdauer und Fehlerklasse geschrieben, ohne Empfänger- oder Beitragsdetails.

## 18. Monitoring

Status ist success, warning bei Teilerfolg oder failed. Zustellungen, Duplikate, Preference-Skips, Fehler und Dauer sind über das vorhandene SQL-basierte Monitoring auswertbar. Retry bleibt deaktiviert.

## 19. Chunking

Feste Größe 100, stabile ID-Pagination, aggregierter Bericht über alle Chunks. Ein fachlich nicht fälliger Datensatz wird gezählt und übersprungen. Ein globaler Lade-/Resolverfehler bricht kontrolliert ab; Notification-Inserts isolieren einzelne Datenbankfehler.

## 20. SQL-Proposals und Reihenfolge

1. Idempotenz-Preflight (read-only).
2. Bei Duplikaten stoppen und separat freigeben; sonst Idempotenzhärtung.
3. Idempotenz-Postcheck.
4. Hosting-Secret und die zwei Vault-Secrets setzen.
5. Route positiv und negativ testen.
6. Cron-Proposal.
7. Cron-Postcheck und nächsten Lauf prüfen.

Keines dieser SQL-Skripte wurde automatisch ausgeführt.

## 21. Manueller Abnahmeplan

Preflight/Index/Postcheck durchführen; Route ohne/falsches/richtiges Secret testen; synthetische Beiträge für -14, -7, 0, +7, +21, Teilzahlung, vollständige Zahlung, Stundung, Befreiung und Preference-Off prüfen; denselben Stichtag wiederholen; Monitoring und Persistenz nach Neustart prüfen; Cron aktivieren und Jobhistorie kontrollieren.

## 22. Risiken und Rollback

Der Produktivstart bleibt blockiert, bis SQL, Secrets und Hosting-Erreichbarkeit manuell abgenommen sind. `deferred_until` ist nicht eindeutig als Ersatzfälligkeit definiert. Cron-Rollback entfernt nur den Job; Idempotenz-Rollback nur den Index. Anwendungscode kann unabhängig zurückgenommen werden. Vault-Secrets werden bewusst nicht automatisch gelöscht.

## 23. Nächster Projektblock

B15.18J2 sollte die Live-Preflightergebnisse, das kontrollierte Aktivierungsprotokoll und einen echten Mehrkonten-End-to-End-Lauf dokumentieren, ohne Retry oder neue Kanäle einzuführen.
