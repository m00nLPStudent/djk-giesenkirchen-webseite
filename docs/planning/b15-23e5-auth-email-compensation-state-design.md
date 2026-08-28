# B15.23E5.2.2 – Expliziter Compensation-Zustand vor dem Auth-Guard

## Entscheidung

Die Live-Diffs trennen den nativen Self-Service-Start und den E3-Admin-Forward eindeutig. Ein produktionsfester Guard ist dennoch noch nicht implementierbar, weil Reverse nach einem mehrdeutig zurückgemeldeten Completion-Commit unter `completed` angefordert werden kann. Ein zeitlich begrenztes `completed`-Allow ist keine robuste Sicherheitsgrenze: Es autorisiert während des Fensters weitere passende Replays, hängt von Uhren und Laufzeiten ab und beschreibt keine ausdrückliche Absicht zur Kompensation.

Bevorzugt wird deshalb **Variante B: eine kleine kontrollierte State-Machine-Erweiterung**. Finale Klassifizierung: **B – kleine kontrollierte Vorarbeit nötig**.

## Zielzustandsmaschine

```text
pending → confirming → completed
              │
              ├→ compensating → failed
              │
completed ────┘  nur nach explizitem, serverseitigem Compensation-Claim
```

Vor jedem Auth-Reverse muss der Server die konkrete Requestzeile atomar von `confirming` oder `completed` nach `compensating` claimen, `compensation_started_at` setzen und den Claim read-after-write verifizieren. Erst danach darf `auth.admin.updateUserById(user_id, { email: old_email })` laufen. Ist der Claim oder seine Verifikation mehrdeutig, erfolgt **kein Reverse**; der Ablauf endet fail-closed mit manueller Prüfung. Nach erfolgreichem oder fehlgeschlagenem Reverse wird `compensating → failed` mit einem passenden `failure_code` ausgeführt.

Damit gibt `compensating` eine einzelne, ausdrückliche und server-only kontrollierte Reverse-Berechtigung. Bereits `completed` allein berechtigt niemals zum Reverse.

## Vorgeschlagene Schemaänderung

Noch nicht umsetzen oder ausführen:

- Status-Constraint um `compensating` erweitern.
- Nullable `compensation_started_at timestamptz` ergänzen.
- State-Constraint ergänzen: `compensating` verlangt `confirmed_at`, `locked_at` und `compensation_started_at`; `cancelled_at` und `expired_at` bleiben null. `completed_at` darf nur dann vorhanden sein, wenn der Claim aus `completed` kam. Nach `compensating → failed` bleibt `compensation_started_at` als datensparsamer Auditzeitpunkt erhalten.
- Partiellen Unique-Index `admin_email_change_requests_one_active_user_idx` auf `pending`, `confirming` und `compensating` erweitern. Dadurch kann während Reverse kein neuer E3-Request für dieselbe UUID entstehen.
- Bestehende Zeilen bleiben unverändert; die neue Spalte ist nullable. Vor Constraintwechsel ist ein read-only Bestandscheck erforderlich.

## Vorgeschlagene Codeänderung

- `beginCompensation(requestId, workflowTimestamp, timestamp)` als atomaren Service-Claim hinzufügen: nur `confirming|completed → compensating`, anschließend Status read-after-write verifizieren. Der `completed`-Zweig muss `confirmed_at` und `completed_at` exakt an den bereits im aktuellen Core vorhandenen `workflowTimestamp` binden; ein Zeitfenster genügt nicht.
- Alle Reverse-Aufrufe im E3-Core müssen zuerst diesen Claim verwenden.
- Die eigentliche E2-Kompensation benötigt den konkreten E3-Kontext. Ein Reverse ohne erfolgreich verifizierten Compensation-Claim wird nicht ausgeführt.
- `failRequest` muss `compensating → failed` erlauben und Lock sowie Compensationzustand terminal behandeln.
- Normaler Forward bleibt vollständig unter `confirming`.
- Completion-Mails bleiben erst nach eindeutig verifiziertem `completed` zulässig.

## Späterer Guard-Vertrag

Der spätere `BEFORE UPDATE ON auth.users FOR EACH ROW`-Guard reagiert nur auf relevante E-Mail-Mutationen:

- **Self-Service blockieren:** `OLD.email IS NOT DISTINCT FROM NEW.email` und mindestens eines der Pending-Email-Change-Felder (`email_change`, `email_change_token_new`, `email_change_token_current`, `email_change_sent_at`) ändert sich. Diese Mutation wird unabhängig von Rolle oder E3-Status abgelehnt.
- **Forward erlauben:** Aktive E-Mail ändert sich, und genau ein passender Request steht `confirming`; UUID, normalisierte alte/neue Adresse passen, `confirmed_at IS NOT NULL` und `confirmed_at <= expires_at`.
- **Reverse erlauben:** Aktive E-Mail ändert sich in Gegenrichtung, und genau ein passender Request steht `compensating`; UUID sowie normalisierte neue/alte Requestadresse passen und `compensation_started_at IS NOT NULL`.
- Jede sonstige aktive E-Mailänderung wird abgelehnt.
- Reine Updates an Passwort-, Recovery-, Reauthentication-, Session- oder Metadatenfeldern bleiben unberührt. Der Guard überwacht weder `updated_at` noch allgemeine Bestätigungsfelder als eigenständigen Sperrgrund.

## Race-, Locking- und Idempotenzbewertung

E3-Claim beziehungsweise Compensation-Claim wird vor dem getrennten GoTrue-HTTP-Aufruf committed. Der Trigger liest daher nur committed Zustände; eine Datenbanktransaktion bleibt nicht über HTTP offen. Der erweiterte Unique-Index verhindert parallele aktive Requests einschließlich Compensation. Ein Self-Service-Start bleibt unabhängig davon blockiert. Ein neuer Request kann erst nach terminalem `failed` oder `completed` entstehen.

Der Trigger benötigt voraussichtlich kein `FOR UPDATE`: Ein Lock im kurzlebigen Auth-Update würde die bereits committed serverseitige Absicht nicht verbessern, könnte aber Lockreihenfolgen verkomplizieren. Der Compensation-Claim selbst muss bedingt und atomar sein. Mehrdeutige Claims sind fail-closed. Dadurch bleibt das Deadlockrisiko gering.

## SECURITY-DEFINER- und Owner-Konzept

Da GoTrue als `supabase_auth_admin` mutiert und die server-only Requesttabelle keine Clientrechte besitzt, muss die spätere Triggerfunktion den Request sicher lesen können. Falls dafür `SECURITY DEFINER` erforderlich ist, erhält sie einen bewusst im Live-Preflight bestätigten kontrollierten Owner, `SET search_path=pg_catalog`, ausschließlich vollqualifizierte Relationsnamen und keinerlei dynamisches SQL. `PUBLIC`, `anon` und `authenticated` erhalten kein EXECUTE; `service_role` nur, falls ein direkter fachlicher Aufruf tatsächlich benötigt wird. Die Triggerausführung selbst darf nicht über einen Client-RPC erreichbar werden.

## Managed-Auth-Risiko und Rollback

`auth.users` ist Supabase-managed. Die beobachteten Pending-Felder sind live vorhanden, aber nicht als dauerhaft unveränderlicher interner Vertrag zu behandeln. Nach jedem Supabase-Auth-Upgrade müssen Spalteninventar, Triggerbestand, Owner, GoTrue-Mutationsdiff und E3-Regression erneut geprüft werden.

Späterer Rollback in umgekehrter Reihenfolge: Auth-Guard-Trigger entfernen, Guardfunktion entfernen, E3-Code auf den vorherigen Stand zurückführen, Unique-Index auf `pending|confirming` zurücksetzen, Constraints auf den alten Zustandsvertrag zurücksetzen und `compensation_started_at` entfernen. Vor dem Constraint-/Spaltenrollback dürfen keine `compensating`-Zeilen existieren; andernfalls stoppt der Rollback zur manuellen Klärung.

## Erforderliche Tests vor Aktivierung

- State-Machine-Tests für `confirming|completed → compensating → failed`.
- Ambiger Compensation-Claim führt zu keinem Auth-Reverse.
- Forward und Reverse benötigen exakt passende UUID und Adressrichtung.
- Paralleler/neuer Request während `compensating` wird verhindert.
- Self-Service-E-Mailstart wird DB-seitig abgelehnt und erzeugt weder Pending-Zustand noch Mail.
- Passwortänderung, Invite, Recovery, Reauthentication, Login, Logout und Refresh bleiben erfolgreich.
- E3-End-to-End, Profilspiegelung, Rollen und Permissions bleiben unverändert.

## Migrationsreihenfolge für den nächsten Block

1. Read-only Preflight für bestehende Statuswerte, Constraints, Index und Funktionsowner.
2. Separates State-Machine-Proposal, Rollback und Postcheck erstellen; noch nicht automatisch ausführen.
3. Nach manueller DB-Freigabe Produktcode auf den expliziten Compensation-Claim umstellen und testen.
4. Erst danach das Auth-Guard-Proposal gegen den neuen nachgewiesenen Vertrag entwerfen.
5. Guard manuell aktivieren und den vollständigen Negativ-/Positiv-Livetest durchführen.

Es wurden in E5.2.2 weder Schema noch Produktcode geändert. B15.23E bleibt offen.

Der E5.2.3-Preflight ist vorbereitet; Stoppentscheidung und spätere Migrationsbedingungen stehen in [`b15-23e5-compensation-state-preflight-analysis.md`](b15-23e5-compensation-state-preflight-analysis.md). Vor dessen manueller Liveausführung entstehen keine Migrationsartefakte.

E5.2.4 hat den manuellen Live-Preflight als **PASS** ausgewertet. Proposal, fail-closed Rollback und sanitierter Postcheck sind vorbereitet, aber noch nicht ausgeführt. Nach erfolgreicher manueller Migration und Postcheck folgt ausschließlich B15.23E5.2.5 zur Implementierung des atomaren Compensation-Claims; der `auth.users`-Guard bleibt ein späterer Block.

Die Migration und ihr Postcheck wurden anschließend manuell erfolgreich bestätigt. E5.2.5 implementiert den Claim-, Read-after-write-, Reverse- und Terminalisierungsvertrag wie geplant. Details: [`b15-23e5-compensation-claim-implementation.md`](b15-23e5-compensation-claim-implementation.md). Der Auth-Guard bleibt weiterhin nicht angewendet.
