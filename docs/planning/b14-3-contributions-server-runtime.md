# B14.3 - Contributions Server Runtime

## 1. Ziel

Dieser Schritt liefert den serverseitigen Runtime-Unterbau fuer das Admin-Modul `Vereinsbeitraege` auf Basis der bereits geplanten Tabellen `player_contributions` und `player_contribution_payments`.

## 2. Architektur

- Server-only DAL unter `src/components/admin/contributions/`
- reine Core-Funktionen fuer Geld- und Statuslogik
- getrennte Read-/Write-Repositories
- fachliche Services pro Mutationsart
- duenne Server Actions unter `src/app/admin/contributions/actions.js`

## 3. RLS-/Serverzugriff

- Auth und Permission-Pruefung laufen zuerst ueber `assertAdminActionPermission(...)` mit dem normalen serverseitigen Session-Client.
- Nach erfolgreichem Guard nutzt das Contributions-Modul `createSupabaseAdminClient()` aus `src/lib/supabase.admin.js` fuer Reads und Writes auf den RLS-geschuetzten Contribution-Tabellen.
- Dadurch bleibt der Service-Role-Key ausschliesslich serverseitig, waehrend privilegierte Queries erst nach explizitem Admin-Guard ausgefuehrt werden.

## 4. Repositorys

- `contributionsRead.repository.js` laedt Listen, Details, Player-, Season- und Payment-Daten in Batch-Queries ohne N+1.
- `contributionsWrite.repository.js` kapselt Minimalzugriffe fuer Create/Update auf Contributions und Payments sowie Existenz- und Dublettenpruefungen.

## 5. DTOs

- `createContributionReadDto(...)` liefert die Listenansicht mit Player-, Season- und Payment-Summary.
- `createContributionDetailDto(...)` erweitert die Listen-DTOs um `payments[]` und interne Audit-Actor-IDs.
- Es werden keine Auth- oder Service-Role-Daten serialisiert.

## 6. Geldmodell

- Geldwerte werden intern in Cent validiert und berechnet.
- Nach aussen werden normierte Decimal-Strings wie `75.50` geliefert.
- Dadurch bleiben Summen cent-genau, ohne unkontrollierte JavaScript-Floats im Fachpfad zu verwenden.

## 7. Statuslogik

- Laufzeitlogik erzwingt die erlaubten Fachpfade fuer `open`, `partially_paid`, `paid`, `deferred`, `exempt`, `canceled`.
- Neue Zahlungen auf `canceled`, `exempt` und im ersten Ausbaustand auch `deferred` werden blockiert.
- Freie Client-Statuswerte werden nicht uebernommen.

## 8. Contribution Create/Edit

- Create verlangt `playerId`, `seasonId`, gueltigen `contributionKey`, `title` und einen positiven Betrag.
- Fuer `regular` wird vorab auf aktive Dubletten geprueft; zusaetzlich wird ein DB-Unique-Fehler benutzerfreundlich gemappt.
- Edit ist fuer `canceled` und `exempt` blockiert.
- `amount_due` darf nicht unter `amount_paid + amount_waived` fallen.
- Bereits voll bezahlte Beitraege werden in diesem ersten Ausbaustand nicht ueber den Edit-Pfad wieder geoeffnet.

## 9. Payments

- Payment-Create schreibt ausschliesslich serverseitig in `player_contribution_payments`.
- Ueberzahlungen werden vor dem Insert geblockt.
- Nach jeder Zahlung wird der Parent-Contribution-Datensatz erneut geladen, damit die vom DB-Trigger berechneten Felder im Ergebnis landen.

## 10. Payment-Storno

- Kein Hard-Delete.
- Payment-Storno setzt `status = canceled`, `canceled_at`, `canceled_by` und `cancellation_reason`.
- Doppeltes Storno wird fachlich abgefangen.

## 11. Stundung

- `deferContribution` verlangt `deferredUntil` und `deferredReason`.
- `resumeContribution` ist nur fuer aktuell `deferred` zulaessig.
- Beim Resume werden `deferred_until` und `deferred_reason` geleert und der Status aus der Summenlage neu bestimmt.

## 12. Befreiung

- Phase 1 implementiert nur die vollstaendige Befreiung.
- Voraussetzung: kein `canceled`, keine gebuchten Zahlungen, Pflichtgrund vorhanden.
- Die Laufzeit setzt `amount_waived = amount_due`, `status = exempt`, `exempted_at` und `exempted_by`.

## 13. Contribution-Storno

- Kein Hard-Delete.
- In diesem ersten Ausbaustand sind Stornos mit bestehenden Zahlungen blockiert.
- Damit bleibt der Regelpfad sicher: zuerst Zahlungen stornieren, danach den Beitrag.

## 14. Statistik

- `loadContributionStats(...)` liefert Counts, Overdue-Wert und Summen serverseitig.
- `paymentsCurrentSeason` wird als Geldsumme der fuer die aktuelle oder gefilterte Saison gebuchten Zahlungen geliefert.

## 15. Permissions

- Beitragsrechte wurden in `src/lib/admin-auth/adminPermissions.js` registriert.
- Die alten zu offenen Contribution-Scope-Helfer in `scopeEngine.js` wurden auf reine Permission-Pruefung reduziert.
- Damit gibt es keine Team-, Jugend- oder Assigned-Team-Vererbung fuer Finanzdaten.

## 16. Server Actions

- implementiert: `createContributionAction`, `updateContributionAction`, `recordContributionPaymentAction`, `cancelContributionPaymentAction`, `deferContributionAction`, `resumeContributionAction`, `exemptContributionAction`, `cancelContributionAction`
- jede Action prueft Auth und Permission, ruft den Service auf, behandelt Fehler und revalidiert `/admin/contributions` sowie optional `/admin/contributions/[id]`

## 17. Fehlerformat

- einheitlich: `ok`, `code`, `message`, `fieldErrors`, `data`
- keine rohen Constraint-Meldungen oder personenbezogenen Debug-Ausgaben an den Client

## 18. Revalidation

- vorbereitet ueber `revalidatePath("/admin/contributions")`
- Detailpfade werden mit konkreter ID revalidiert, auch wenn die Seiten erst spaeter gebaut werden

## 19. Tests

- Unit-Tests decken Geldlogik, Create/Edit, Payments, Defer/Resume, Exempt/Cancel, Stats und Rollenmatrix ab.
- Die Services sind absichtlich dependency-injectable gebaut, damit fachliche Regeln ohne Live-DB testbar bleiben.

## 20. Offene Risiken

- Mangels Live-DB-Zugriff konnte nicht verifiziert werden, ob die produktiven RLS-Policies Reads mit dem normalen Session-Client zulassen; die Runtime verwendet deshalb konsequent den serverseitigen Service-Role-Pfad nach erfolgreichem Admin-Guard.
- `revokeExemption` ist bewusst noch nicht implementiert.
- Die Datenmodell-Dokumente aus B14.1 enthalten teils ueberholte Spalten (`team_season_id`, `contribution_type`, `posted`), die Runtime richtet sich deshalb strikt nach B14.2-Schema und SQL-Proposal.
- Zero-amount-Contributions werden im Runtime-Pfad blockiert, weil die B14.2-Status-Checks fuer normale offene/bezahlt-Zustaende sonst widerspruechlich waeren.

## 21. Empfohlener naechster Schritt

B14.4 sollte die Admin-Seite `/admin/contributions` samt Filter-UI, Detailansicht, Dialogen und optionalem CSV-Download auf diese serverseitigen Actions und Read-DTOs aufsetzen.
