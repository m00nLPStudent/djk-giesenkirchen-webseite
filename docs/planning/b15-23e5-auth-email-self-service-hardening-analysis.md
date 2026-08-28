# B15.23E5 – Supabase Auth Self-Service Email Change Hardening

## Bestätigte Sicherheitslücke

Der kontrollierte Live-Negativtest ist fehlgeschlagen. Eine normale angemeldete Nicht-Superadmin-Testidentität konnte direkt über `PUT /auth/v1/user` einen E-Mail-Wechsel anfordern. Supabase antwortete mit HTTP 200, behielt die aktuelle Adresse in `email` und setzte die angeforderte Adresse in `new_email`. Der Bestätigungslink wurde nicht verwendet. Damit ist der unabhängige Self-Service-Pfad live bewiesen und als **CONFIRMED SECURITY GAP** klassifiziert. Testadresse und temporärer Access-Token werden weder dokumentiert noch wiederverwendet.

## Auth-Architektur und unverzichtbare Flows

Die Anwendung verwendet den öffentlichen Supabase-Browserclient für Login, Logout, Session, Refresh, Recovery-/Invite-Session und Passwortsetzung. `/admin/profile` ändert über `auth.updateUser()` ausschließlich das Passwort. Der SSR-/Proxy-Client validiert Sessions und synchronisiert Cookies. Invite und Recovery verwenden die vorgesehenen Supabase-Auth-Flows. Der Service-Role-Client bleibt server-only; E3 finalisiert ausschließlich per UUID über `auth.admin.updateUserById({ email })`.

Publishable/Anon Key und eigener Access-Token sind erwartbar im Browser vorhanden. Das Entfernen eines Helpers oder ein eigener Wrapper sperrt deshalb den nativen Auth-Endpunkt nicht. RLS auf `public.admin_profiles` wirkt nur auf Public-/PostgREST-Tabellen und nicht als Autorisierung vor GoTrue `PUT /auth/v1/user`.

## Offiziell verfügbare Supabase-Grenzen

Die aktuelle Supabase-Konfiguration bietet Confirm Email, Secure/Double Confirm Email Change, Signup-, Provider-, Session- und Rate-Limit-Optionen, aber keine dokumentierte Einstellung „Self-Service Email Change deaktivieren“. Secure Email Change verändert nur die Bestätigungsanforderung und ist kein Startverbot.

Die dokumentierten Auth Hooks sind Before User Created, Custom Access Token, Send SMS, Send Email, MFA Verification Attempt und Password Verification Attempt. Keiner ist ein Before User Updated, Before Email Change oder Before Account Update Hook. Before User Created betrifft neue Accounts, Custom Access Token die Tokenausgabe und die Verification-Hooks Anmeldung beziehungsweise Verifikation. Keiner kann diesen authentifizierten User-Update-Request selektiv ablehnen.

Ein Send-Email-Hook übernimmt bei Aktivierung den gesamten Auth-Mailversand. Er ist keine spezialisierte Update-Autorisierungsgrenze; Invite, Recovery, Magic Link und weitere Auth-Mails müssten vollständig migriert werden. Ein bloßes Nichtversenden bei bereits angenommenem `new_email` wäre „security by missing email“ und erfüllt den Vertrag nicht.

## Entscheidungsmatrix

| Option | Request blockiert | Email/Passwort getrennt | Self-Service/Admin getrennt | Invite/Recovery | Support/Wartbarkeit | Aufwand | Geeignet |
|---|---|---|---|---|---|---|---|
| A – native Auth-Einstellung | Nein, nicht dokumentiert | – | – | – | hoch, falls vorhanden | niedrig | Nein |
| B – offizieller Before-Update-Hook | Nein, nicht verfügbar | – | – | – | wäre ideal | mittel | Nein |
| C – enger `auth.users`-Triggerguard | Potenziell bereits bei internen Email-Change-Feldern | Ja | Über Mutationsform und bestätigten E3-Zustand konzipierbar | per Preflight zu beweisen | Auth-Trigger dokumentiert, interne Spalten upgrade-sensibel | mittel | Bevorzugter Kandidat nach Preflight |
| D – Send-Email-Hook | Nicht als spezialisierter Guard belegt | Emailaktion erkennbar | E3 Admin API sendet keine Change-Mail | übernimmt alle Auth-Mails | offiziell, falsche Schicht | hoch | Nein |
| E – Browserclient/Serverproxy | Nein, Originalendpoint bleibt erreichbar | nur im Wrapper | nein | hohes Bypassrisiko | Scheinlösung | hoch | Nein |
| F – eigenes Auth-System/Gateway | Nur bei vollständiger Ablösung/upstream Enforcement | Ja | Ja | umfassende Migration | sehr hoher Betrieb | sehr hoch | letzter Fallback |

## Bevorzugte Lösung und Sicherheitsbedingungen

Bevorzugter Kandidat ist ein minimaler `BEFORE UPDATE`-Triggerguard auf `auth.users`, aber ausschließlich nach dem manuellen Read-only-Preflight. Supabase dokumentiert Trigger auf `auth.users` als verwendbares Muster, warnt jedoch, dass das Auth-Schema verwaltet wird und außer Primärschlüsseln Spalten und interne Objekte geändert werden können. Daher entsteht kein Proposal auf Basis vermuteter Spalten.

Der Guard müsste bereits Self-Service-Initiierung über die live bestätigten internen Email-Change-Felder vollständig ablehnen. Passwort-, Session- und Metadatenupdates müssen passieren. Eine direkte Änderung der aktiven `email` darf nur während eines passenden, gültigen E3-Requests im Status `confirming` für dieselbe UUID und erwartete alte/neue Adresse zulässig sein. Invite-INSERTs werden nicht berührt. Recovery und Passwortänderungen dürfen keine überwachten Emailfelder ändern.

Self-Service und Admin API laufen voraussichtlich beide über `supabase_auth_admin`; die DB-Rolle allein ist deshalb keine zuverlässige Trennung. Die beobachtete Mutationsform unterscheidet sie: Self-Service setzt Pending-Change-Felder, `auth.admin.updateUserById({ email })` setzt die aktive Adresse direkt. Ob Spalten, Triggerreihenfolge und Mutationsformen im Liveprojekt exakt passen, muss der Preflight bestätigen.

## SQL-Reihenfolge

1. [`../sql/b15-23e5-auth-email-self-service-hardening-preflight-readonly.sql`](../sql/b15-23e5-auth-email-self-service-hardening-preflight-readonly.sql) manuell ausführen.
2. Resultsets ohne Adressen, Tokens oder CSV-Dateien im Repository auswerten.
3. Erst danach Guard-Proposal, Postcheck und Rollback gegen die bestätigten Spalten, Trigger, Owner und Privilegien erstellen.
4. Proposal nur nach ausdrücklicher Freigabe manuell anwenden.

## Offener Self-Service-Pending-Zustand

Der Testlink wurde nicht bestätigt. Tokenablauf verhindert nach Ablauf die erfolgreiche Verifikation, garantiert aber nicht die sofortige Entfernung von `new_email`. Der Preflight zählt Pending-Zustände nur aggregiert. Danach soll im Supabase-Dashboard für die entbehrliche Testidentität geprüft werden, ob `new_email` noch gesetzt ist. Falls ja, nicht bestätigen. Eine Bereinigung erfolgt erst nach gesonderter Freigabe über eine unterstützte Admin-Operation und anschließenden read-only Nachweis.

## Tests nach späterem Hardening

- Normaler `PUT /auth/v1/user` mit `email`: 4xx, kein `new_email`, keine Auth-Mail.
- Normaler Passwortwechsel bleibt erfolgreich.
- Vollständiger E3-Flow bleibt erfolgreich.
- Admin Invitation und Set-Password bleiben erfolgreich.
- Password Recovery und Callback bleiben erfolgreich.
- Sessionrefresh, Login und Logout bleiben unverändert.

B15.23E bleibt **OPEN / SECURITY HARDENING REQUIRED**. Der manuelle E5.2-Preflight bestätigte Schema, ausschließlich interne FK-Trigger und `supabase_auth_admin` als allein privilegierte Auth-Tabellenrolle. Weil genaue Admin-Forward-/Compensation-Spaltendiffs und der Completion-Ambiguitätsvertrag noch fehlen, ist der Trigger noch nicht produktionsfest beweisbar. Details und kleinster Zusatztest: [`b15-23e5-auth-email-self-service-hardening-live-preflight-analysis.md`](b15-23e5-auth-email-self-service-hardening-live-preflight-analysis.md). E5.1/E5.2 haben keine Livekonfiguration, keinen Authuser und kein Schema verändert und kein SQL durch Codex ausgeführt.

E5.2.1 hat den E3/E2-Codevertrag weiter präzisiert: Forward und normale Reverse-Kompensation laufen bei `confirming`; erst danach folgen `completed` beziehungsweise `failed`. Eine mehrdeutige Completion-Markierung kann Reverse jedoch auch nach einem bereits committed `completed` anfordern. Deshalb bleibt ein Produktionsguard gesperrt. Der [sanitisierte Mutationsform-Testplan](b15-23e5-auth-email-mutation-form-verification.md) wartet auf die manuell erzeugten lokalen Before/After-Exporte; kein SQL wurde durch Codex ausgeführt.

E5.2.2 wertete die vollständig sanitisiert übermittelten Live-Resultsets aus. Self-Service setzt ausschließlich den nativen Pending-E-Mailzustand bei unveränderter aktiver Adresse und ohne E3-Request; E3-Forward ändert die aktive Adresse bei leeren nativen Pending-Feldern und passendem Workflow. Ein Guard ist daher anhand der Mutationsform grundsätzlich möglich. Für die Completion-Ambiguität ist jedoch kein Zeitfenster-Workaround freigegeben: Vor Reverse soll ein expliziter, atomar verifizierter `compensating`-Claim eingeführt werden. Klassifizierung **B**, Design: [`b15-23e5-auth-email-compensation-state-design.md`](b15-23e5-auth-email-compensation-state-design.md). Produktcode, Schema und Live-Datenbank blieben unverändert.

E5.2.3 bereitet den vollständigen [read-only Compensation-State-Preflight](../sql/b15-23e5-compensation-state-preflight-readonly.sql) vor. Da die bisherigen Resultsets nicht sämtliche heute wirksamen Schemaabhängigkeiten zweifelsfrei abdecken, greift die Stoppregel vor Migration, Rollback und Postcheck. Der geplante Completed-Claim wird nicht über ein Zeitfenster, sondern über den exakten Workflow-Zeitstempel, Request-ID, UUID und beide Adressrichtungen gebunden. Details: [`b15-23e5-compensation-state-preflight-analysis.md`](b15-23e5-compensation-state-preflight-analysis.md).

E5.2.4 klassifiziert den vollständig manuell ausgeführten Compensation-State-Preflight als **PASS**. Der Livezustand entspricht dem erwarteten server-only Vertrag; vier vorhandene Requests sind valide und bleiben unverändert. State-Migration, Rollback und Read-only Postcheck sind vorbereitet, jedoch **MIGRATION NOT YET APPLIED**. Nach manueller Anwendung und bestandenem Postcheck folgt B15.23E5.2.5; ein Auth-Guard ist weiterhin nicht erstellt.

Die State-Migration wurde inzwischen manuell angewendet und per Postcheck vollständig bestätigt. E5.2.5 hat den zentralen Compensation-Claim implementiert: Kein Produktcode-Reverse findet mehr vor einem atomaren, exakt gebundenen und read-after-write verifizierten `compensating`-Claim statt. Success-/Failure-Terminalisierung bewahrt den Auditzeitpunkt und räumt Lock/Completionzustand auf. Implementierungsnachweis: [`b15-23e5-compensation-claim-implementation.md`](b15-23e5-compensation-claim-implementation.md). **AUTH.USERS GUARD: NOT YET APPLIED.**

E5.3 bereitet nun ausschließlich den neuen sanitisierten Live-Preflight für den engen `auth.users`-E-Mail-Guard vor. Weil Function Owner, effektive Request-Table-Rechte von `supabase_auth_admin`, mögliche Namenskollisionen und aktuelle native Pending-Counts live bestätigt werden müssen, existieren noch kein Proposal, Rollback oder Postcheck. Status: **GUARD PREFLIGHT PREPARED – NOT LIVE**. Details: [`b15-23e5-auth-users-email-guard-preflight-design.md`](b15-23e5-auth-users-email-guard-preflight-design.md).

E5.3.1 wertete den vollständig manuell ausgeführten Guard-Preflight als **PASS** aus. `supabase_auth_admin` kann die Requesttabelle nicht lesen; deshalb wurde die eng begrenzte Guardfunktion als `SECURITY DEFINER`, Owner `postgres`, mit festem `pg_catalog`-Suchpfad entworfen. Proposal und Postcheck wurden anschließend manuell erfolgreich ausgeführt; der Guard ist live. Self-Service-Block sowie die Kernregressionen sind bestätigt. Der zusätzliche künstliche Compensation-Livetest wird bewusst nicht ausgeführt: **NOT LIVE EXECUTED – COVERED BY AUTOMATED TESTS**. B15.23E ist technisch abgeschlossen; der Managed-Schema-Guard bleibt upgrade-sensitiv.
