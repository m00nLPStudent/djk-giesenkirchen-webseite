# B15.23E5.2 – Live-Preflight-Auswertung

## Resultsets

Der manuell ausgeführte Read-only-Preflight lieferte neun lesbare CSV-Resultsets. Ein zehntes, im SQL Editor manuell bestätigtes Resultset zur Suche nach normalen `public`-Funktionen mit `auth.users` oder `email_change` in der Definition war leer. Codex hat kein SQL ausgeführt und den ignorierten Ordner `.local/db-preflight` nicht verändert.

`auth.users` gehört `supabase_auth_admin`, hat RLS aktiviert und kein FORCE RLS. Die Relation enthält 35 Spalten. Für E-Mailwechsel relevant sind `email`, `email_confirmed_at`, `confirmation_token`, `confirmation_sent_at`, `email_change`, `email_change_token_new`, `email_change_token_current`, `email_change_confirm_status`, `email_change_sent_at` und `updated_at`. Passwort-, Recovery- und Reauthentication-Zustände sind davon getrennt in `encrypted_password`, `recovery_token`, `recovery_sent_at`, `reauthentication_token` und `reauthentication_sent_at` abgebildet. Metadaten liegen in `raw_user_meta_data` und `raw_app_meta_data`.

Vier Authuser existieren. Genau einer besitzt einen nativen Pending-E-Mailwechsel und `email_change_sent_at`; dies ist der unbestätigte kontrollierte Negativtest. Die E3-Tabelle enthält eine abgeschlossene und zwei fehlgeschlagene Zeilen, keine aktive `pending`- oder `confirming`-Zeile.

## Constraints und Indizes

`users_email_change_confirm_status_check` beschränkt den Status auf 0 bis 2. `users_pkey` schützt die UUID und `users_phone_key` die Telefonnummer. Die 15 Indizes umfassen die eindeutigen partiellen Tokenindizes `email_change_token_current_idx`, `email_change_token_new_idx`, `confirmation_token_idx`, `recovery_token_idx` und `reauthentication_token_idx`, die E-Mail-Indizes `idx_users_email`, `users_email_partial_key` und `users_instance_id_email_idx` sowie Zeit-, Instanz-, Name-, Anonymous-, Phone- und Primary-Key-Indizes. Ein `BEFORE UPDATE`-Guard verändert diese Objekte nicht; eine Ablehnung muss vor Indexpflege erfolgen.

## Triggerinventar

Alle 26 Trigger sind interne PostgreSQL-FK-Constraint-Trigger (`tgisinternal=true`, enabled mode `O`). Sie verbinden `auth.users` mit `auth.identities`, `auth.sessions`, `auth.mfa_factors`, `auth.one_time_tokens`, `auth.oauth_authorizations`, `auth.oauth_consents`, `auth.webauthn_credentials`, `auth.webauthn_challenges`, `public.admin_profiles`, `public.admin_user_roles`, `public.notifications` und `public.notification_preferences`. Verwendet werden ausschließlich die internen Funktionen `RI_FKey_cascade_del()`, `RI_FKey_noaction_upd()` und `RI_FKey_setnull_del()`, Owner `supabase_admin`, ohne SECURITY DEFINER. Es existieren weder projektdefinierte noch sonstige unerwartete Trigger auf `auth.users`.

## Rollen und Ausführungskontext

`anon`, `authenticated` und `service_role` besitzen auf `auth.users` keinerlei SELECT-, INSERT-, UPDATE-, DELETE-, TRUNCATE-, REFERENCES- oder TRIGGER-Rechte. Nur `supabase_auth_admin` besitzt alle inventarisierten Tabellenrechte. Der öffentliche Access-Token führt daher nicht zu einem direkten PostgREST-UPDATE. `PUT /auth/v1/user` wird von GoTrue verarbeitet, das als `supabase_auth_admin` in die Authrelation schreibt. Auch die serverseitige Auth Admin API wird vom Authdienst umgesetzt und ist im Trigger nicht zuverlässig über `current_user` vom Self-Service zu unterscheiden. Der Service-Role-Key autorisiert die Admin-API-Anfrage, ist aber nicht die Rolle der eigentlichen Tabellenmutation.

## Mutationsformen und offene Beweisfrage

Der Self-Service-Livetest beweist: Beim Start bleibt die aktive `email` unverändert und ein Pending-Wert wird als `new_email` zurückgegeben. Live-Schema und Indizes zeigen, dass GoTrue hierfür `email_change`, beide Email-Change-Tokenfelder, `email_change_confirm_status`, `email_change_sent_at` und `updated_at` vorhält. Der vorliegende Preflight ist jedoch kein Before/After-Diff und beweist nicht, welche Teilmenge bei genau diesem Request geändert wurde.

Supabase dokumentiert `auth.admin.updateUserById({ email })` als unmittelbare Änderung ohne Confirmation-Flow, und der E3-Livetest bestätigt die sofortige Loginänderung. Der Preflight beweist dennoch nicht, ob die Admin API dabei zusätzlich Pending-/Tokenfelder leert oder anderweitig verändert. Ebenso fehlt ein beobachteter Spaltendiff für die E2-Kompensation von neuer zurück auf alte Adresse.

## E3-Allow-Contract

Ein `confirming`-Request ist ein starker fachlicher Allow-Context: stabile `user_id`, normalisierte `old_email`/`new_email`, erfolgreicher Claim vor Ablauf und partieller Unique-Index für höchstens einen aktiven Request. Der E3-Service committed den Claim über Supabase/PostgREST, bevor der getrennte Auth-Admin-HTTP-Aufruf beginnt. Der Trigger würde anschließend nur lesend auf diese bereits committed Zeile zugreifen; dadurch entsteht kein zyklischer Lock und das Deadlockrisiko ist gering.

Forward wäre als `OLD.email = request.old_email` und `NEW.email = request.new_email` prüfbar. Die normale E2-Kompensation geschieht noch im Status `confirming` und wäre in Gegenrichtung prüfbar. Eine seltene Kompensation nach mehrdeutig fehlgeschlagener Completion-Markierung kann jedoch auf einen bereits `completed` gesetzten Request treffen. Ein Guard, der ausschließlich `confirming` erlaubt, könnte diese bestehende Sicherheitskompensation blockieren; ein dauerhaftes `completed`-Allow wäre dagegen zu weit. Dieser Vertrag muss vor einem Proposal explizit gelöst und getestet werden.

## Entscheidungsmatrix

| Variante | Bewertung |
|---|---|
| A – nur Email-Change-Felder blockieren | Stoppt Self-Service wahrscheinlich, beweist Admin-/interne Nebenwirkungen aber nicht und erzwingt nicht E3 für direkte aktive E-Mailupdates. Nicht ausreichend. |
| B – direkte `email`-Änderung nur bei `confirming` | Guter E3-Forward-Contract, blockiert den Self-Service-Start allein nicht und gefährdet den Completion-Ambiguitätsfall. Nicht ausreichend. |
| C – Mutationsform plus E3-Matching | Zielarchitektur mit höchster Sicherheit; aktuell fehlen zwei Mutationsformnachweise und ein belastbarer Compensation-Contract. Noch nicht freigabefähig. |
| D – Rollenunterscheidung | Ungeeignet, da beide Pfade über `supabase_auth_admin` mutieren. |
| E – größerer Auth-Umbau | Derzeit nicht gerechtfertigt, solange Variante C mit kleinem Zusatztest geklärt werden kann. |

## Kleinster zusätzlicher Live-Test

Mit einer entbehrlichen normalen Testidentität müssen ohne reale Adressen in Exporten drei sanitisierten Before/After-Snapshots erhoben werden. Jeder Snapshot gibt ausschließlich boolesche `IS DISTINCT FROM`-Flags für die 35 bekannten Spalten aus, niemals Werte, Tokens, Hashes oder IDs:

1. Self-Service-Initiierung: Ausgangssnapshot, einmaliger `PUT /auth/v1/user`, danach Spalten-Diff; Link nicht bestätigen.
2. E3-Forward: Ausgangssnapshot unmittelbar vor dem bestätigten E3-POST und Snapshot danach.
3. E2-Reverse-Compensation: bevorzugt automatisiert gegen einen realitätsgetreuen Repository-Harness. Falls ein echter Auth-Admin-Aufruf unvermeidbar ist, nur mit entbehrlicher Identität und kontrolliert provoziertem Profilfehler nach gesonderter Freigabe. Zusätzlich muss der Status des E3-Requests während Forward und Reverse erfasst werden.

Vor einem Produktproposal muss außerdem entschieden werden, wie die Completion-Markierungs-Ambiguität kompensationssicher autorisiert wird. Erst diese Ergebnisse beweisen, welche Spalten der Trigger beobachten darf und welche Forward-/Reverse-Zustände er zulassen muss.

## Bestehender Pending-Testzustand

`email_change`, Tokenfelder, Status und Versandzeit bilden den Pending-Zustand. Der Token läuft gemäß Auth-Konfiguration ab; der Preflight beweist keine automatische Leerung von `email_change`. Deshalb ist automatische Bereinigung nicht nachgewiesen. E5.2.1 bereitet hierfür ein strikt auf eine lokal eingesetzte Test-UUID begrenztes, transaktionales Cleanup-Proposal und einen sanitisierten Read-only Postcheck vor. Das Proposal greift direkt in verwalteten Authzustand ein, ist keine reguläre Produktoperation und darf erst nach ausdrücklicher manueller Prüfung und Freigabe ausgeführt werden.

## Klassifizierung

## E5.2.1 – vorbereiteter Mutationsformnachweis

Die Codeanalyse bestätigt, dass E3 den Request vor dem Auth-Admin-Aufruf als `confirming` claimt und ihn erst nach vollständig verifiziertem Auth-/Profil-Forward als `completed` markiert. Normale E2-Kompensation läuft noch unter `confirming` und terminalisiert danach als `failed`. Ein Read-after-write-Ambiguitätsfall bei `completeRequest` kann allerdings eine Reverse-Anforderung auslösen, obwohl die Datenbankzeile bereits `completed` ist; dieser Ausnahmevertrag ist vor einem Guard weiterhin zu lösen.

Der sanitierte Read-only Helper, Cleanup-Artefakte, Zustandsmatrix und die manuelle Exportfolge sind in [`b15-23e5-auth-email-mutation-form-verification.md`](b15-23e5-auth-email-mutation-form-verification.md) dokumentiert. Es wurde nichts live ausgeführt. Erwartet werden ausschließlich lokale, ignorierte Bool-/Status-CSV-Exporte für Self-Service Before/After und Admin-Forward Before/After.

## E5.2.2 – finale Live-Diff-Auswertung

Die fünf sanitisierten, manuell übermittelten Resultsets enthalten keine Identitäten, Adressen oder Tokenwerte. Cleanup bestätigt einen leeren nativen Pending-Zustand. Self-Service Before/After beweist: aktive Adresse unverändert; `email_change`, beide Email-Change-Tokenfelder und `email_change_sent_at` werden gesetzt; Status bleibt numerisch 0; kein E3-Request entsteht. Admin-Forward Before/After beweist: aktive Adresse wechselt in erwarteter Richtung, alle nativen Pending-Felder bleiben leer und der `completed`-Zähler steigt um eins.

Damit sind Self-Service und E3-Forward anhand der relevanten Mutationsform eindeutig unterscheidbar. Forward und normale Reverse-Kompensation sind belastbar. Nicht belastbar wäre nur ein generelles oder zeitgebundenes Reverse-Allow unter `completed`. Die sichere Lösung ist ein vor Reverse atomar gesetzter und verifizierter `compensating`-Status; Details stehen in [`b15-23e5-auth-email-compensation-state-design.md`](b15-23e5-auth-email-compensation-state-design.md).

**B – kleine kontrollierte Vorarbeit nötig.** Vor dem Auth-Guard muss die E3-State-Machine den expliziten Compensation-Claim erhalten. Gemäß STOPP-Regel entstehen in E5.2.2 weder Guard noch Trigger noch Produktions-Hardening-Proposal. B15.23E bleibt `OPEN / SECURITY HARDENING REQUIRED`.
