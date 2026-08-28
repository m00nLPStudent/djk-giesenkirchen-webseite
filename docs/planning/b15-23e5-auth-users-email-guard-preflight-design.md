# B15.23E5.3 – auth.users E-Mail-Guard: Preflight und Designgrenze

## Status

**GUARD LIVE.** Der manuelle Postcheck sowie Self-Service-, Passwort-, Session-, Recovery-, Invite- und E3-Forward-Regressionen sind erfolgreich. Der zusätzliche künstliche Compensation-Livetest wird bewusst nicht ausgeführt: **NOT LIVE EXECUTED – COVERED BY AUTOMATED TESTS**.

Der native Supabase-Self-Service-Start ist live als Änderung der Pending-E-Mail-Felder bei unveränderter aktiver E-Mail bewiesen. E3-Forward und der E5.2.5-Reverse besitzen dagegen explizite, serverseitig verifizierte Workflowzustände. Ein enger `BEFORE UPDATE`-Guard ist daher technisch erforderlich, darf wegen des Supabase-managed `auth.users`-Schemas aber erst nach einem neuen Live-Preflight entworfen werden.

## Read-only Preflight

[`b15-23e5-auth-users-email-guard-preflight-readonly.sql`](../sql/b15-23e5-auth-users-email-guard-preflight-readonly.sql) inventarisiert sanitisiert:

- Owner, RLS/FORCE RLS und relevante `auth.users`-Spalten,
- sämtliche sowie gesondert alle nicht-internen Trigger,
- normale Triggerfunktionen, Owner, `SECURITY DEFINER` und `search_path`,
- direkte und effektive Rechte von `postgres`, `supabase_admin`, `supabase_auth_admin`, `service_role`, `authenticated` und `anon`,
- Ausführungsvoraussetzungen auf `auth` und `public`,
- Owner, RLS, Policies, Grants, Spalten, Constraints und Indizes der Requesttabelle,
- ausschließlich aggregierte Counts nativer Pending-Zustände,
- mögliche Namenskollisionen und relevante Katalogabhängigkeiten.

UUIDs, E-Mail-Adressen und Tokenwerte werden nicht ausgegeben. Das Skript läuft in `BEGIN TRANSACTION READ ONLY` und enthält keine Mutation.

## Vorläufiger Guard-Vertrag

Der spätere Guard bleibt auf relevante E-Mail-Felder beschränkt. Vorgesehen ist `BEFORE UPDATE`, niemals `BEFORE INSERT`, mit einer engen `WHEN`-Klausel. Änderungen ausschließlich an Passwort, Recovery, Invite, Login, Session, Metadaten oder Telefon bleiben außerhalb der Guardfunktion.

- Unveränderte aktive E-Mail plus Änderung eines nativen Pending-E-Mail-Feldes: fail closed.
- Direkter `OLD → NEW`-Wechsel: nur bei exakt einem passenden `confirming`-Request.
- Direkter `NEW → OLD`-Reverse: nur bei exakt einem passenden `compensating`-Request.
- Vergleiche verwenden nullsicher `lower(btrim(email))`, stabile UUID und vollständige Zustandsmerkmale; kein Zeitfenster und kein `LIMIT 1`.
- Kein `FOR UPDATE`: Der Application-State ist vor dem HTTP-Auth-Aufruf committed. Dadurch bleibt das Deadlock-Risiko gering.

## Live-Auswertung und Sicherheitsentscheidung

Der manuell ausgeführte Preflight ist **PASS**. `auth.users` gehört `supabase_auth_admin`, besitzt RLS ohne FORCE RLS, alle 19 erwarteten Spalten und genau 26 interne RI-/FK-Trigger. Nicht-interne Trigger, Guard-Funktionen, Namenskollisionen und native Pending-Zustände sind nicht vorhanden; alle sechs Pending-Zähler sind null. Die Requesttabelle gehört `postgres`, besitzt RLS ohne FORCE RLS, keine Policies und den live migrierten `compensating`-Vertrag. `supabase_auth_admin` besitzt dort kein SELECT.

Eine Invoker-Funktion könnte den Workflowzustand deshalb nicht lesen. Das [Proposal](../sql/b15-23e5-auth-users-email-guard-proposal.sql) verwendet eine kontrollierte `SECURITY DEFINER`-Triggerfunktion mit Owner `postgres`, `SET search_path=pg_catalog`, vollqualifizierten Relationen und ohne dynamisches SQL. EXECUTE wird `PUBLIC`, `anon`, `authenticated` und `service_role` entzogen; ein zusätzlicher Grant an `supabase_auth_admin` entsteht nicht. Die gebundene Triggerausführung wird über den bei der Triggererstellung berechtigten Owner eingerichtet und benötigt keinen direkten Client-RPC-Vertrag.

Proposal und [Postcheck](../sql/b15-23e5-auth-users-email-guard-postcheck-readonly.sql) wurden inzwischen manuell erfolgreich ausgeführt; der Guard ist live. Der [Rollback](../sql/b15-23e5-auth-users-email-guard-rollback.sql) bleibt ausschließlich für einen kontrollierten Fehlerfall vorgesehen und wurde nicht ausgeführt.

## Managed-Schema- und Upgrade-Risiko

Ein eigener Trigger auf `auth.users` ist upgrade-sensitiv. Nach relevanten Supabase-Auth-/GoTrue-Upgrades müssen Spalten und Trigger erneut preflighted sowie Self-Service, E3-Forward, Compensation, Passwort, Recovery, Invite, Login und Session Refresh erneut getestet werden. Vor jeder späteren Aktivierung müssen außerdem alle aggregierten Pending-State-Counts null und mögliche Namenskollisionen ausgeschlossen sein; eine automatische Bereinigung gehört nicht in das Guard-Proposal.

## Manueller Testplan nach einer später freigegebenen Aktivierung

1. Read-only Postcheck vollständig ausführen.
2. Mit einem disposable normalen User einen nativen E-Mail-Self-Service-Start versuchen: Auth-Fehler, unveränderte aktive Adresse, alle Pending-Felder leer, kein E3-Request; zusätzlich beobachten, ob eine Auth-Mail entstand, aber keinen Link öffnen.
3. Passwortwechsel, Login, Logout, Session Refresh und Recovery prüfen.
4. Admin-Invite prüfen.
5. Vollständigen E3-Forward `pending → confirming → OLD→NEW → completed` prüfen.
6. Nach relevanten Supabase-Auth-Upgrades den automatisierten Compensation-Vertrag `confirming/completed → compensating → NEW→OLD → failed` erneut prüfen.
7. Profile Mirror, Rollen und Permissions verifizieren.

Bei einem kritischen Fehler zuerst den fail-closed Rollback prüfen und anschließend manuell ausführen. Das Proposal führt keine Pending-Bereinigung durch.

## Abschluss

Proposal und Postcheck wurden manuell erfolgreich ausgeführt; der Rollback blieb unbenutzt. Auch der finale aggregierte B15.23E-Postcheck unter [`../sql/b15-23e-final-postcheck-readonly.sql`](../sql/b15-23e-final-postcheck-readonly.sql) wurde manuell vollständig mit **PASS** ausgewertet: alle acht Abschlussprüfungen sind wahr, es bestehen keine nativen Pending-E-Mail-Zustände, keine aktiven Requests und keine Auth/Profile-Inkonsistenzen. Codex hat kein SQL ausgeführt und keine Live-Datenbank verändert.
