# B15.23E3.1.1 – Live-Preflight-Auswertung

## Ausführungsgrenze

Der read-only Preflight wurde am 28. August 2026 manuell im Supabase SQL Editor ausgeführt. Für diese Auswertung wurden ausschließlich die 14 aktuellen CSV-Dateien in `.local/db-preflight` gelesen. Die Dateien wurden weder verändert noch gestaged; es wurde kein SQL durch Codex ausgeführt und keine Datenbankstruktur verändert. Die Resultsets enthalten keine einzelnen UUIDs oder E-Mail-Adressen.

## Resultset-Zuordnung

| CSV | Preflight-Abfrage | Ergebnis | Sicherheitsrelevant |
| --- | --- | --- | --- |
| `1.csv` | 1 – Relation/RLS | fünf relevante Relationen; E3-Tabelle fehlt; alle vorhandenen Tabellen mit RLS, ohne FORCE RLS | ja |
| `2.csv` | 2 – Spalten/FK-Ziele | 77 Katalogzeilen; `admin_profiles.id` ist UUID/NOT NULL | ja |
| `3.csv` | 3 – Constraints/FKs | 22 Constraints; Profil-ID verweist auf `auth.users(id) ON DELETE CASCADE` | ja |
| `4.csv` | 4 – Indizes | sieben relevante bestehende Indizes; kein E3-Index | ja |
| `5.csv` | 5 – Policies | fünf Policies; keine E3-Policy; `notification_audit` nur Superadmin-SELECT | ja |
| `6.csv` | 6a – Tabellengrants | server-only Muster bei `notification_deliveries`; keine E3-Grants, da Relation fehlt | ja |
| `6_1.csv` | 6b – Spaltengrants | bestehende Spaltengrants inventarisiert; keine E3-Spaltengrants | ja |
| `7.csv` | 7 – effektive E3-Rechte | alle Werte `false`, weil die E3-Relation noch nicht existiert | ja |
| `8.csv` | 8 – Updated-at-Routinen | `public.set_updated_at()` vorhanden, normaler Triggerhelper, kein SECURITY DEFINER | ja |
| `9.csv` | 9 – Triggerpattern | 23 Trigger; generischer `set_updated_at()`-Einsatz bestätigt | ja |
| `10.csv` | 10a – Auditspalten | notification-spezifische Auditstruktur bestätigt | ja |
| `10_1.csv` | 10b – Auditconstraints | Statusmenge ist notification-spezifisch und für E3 ungeeignet | ja |
| `11.csv` | 11 – aggregierte Identitätskonsistenz | vier Auth-Benutzer, vier Profile, vier ID-Matches, null normalisierte E-Mail-Abweichungen | ja |
| `12.csv` | 12 – E3-Relation/Bestand | Relation `null`, geschätzter Bestand `0` | ja |

Alle Abfragen sind zugeordnet. Es fehlen keine Resultsets und kein Resultset ist leer; `null` in `12.csv` ist das erwartete gültige Nichtexistenz-Ergebnis.

## Finaler Schema-Vertrag

- Tabelle: `public.admin_email_change_requests`.
- Primärschlüssel: `id uuid DEFAULT gen_random_uuid()`.
- Zielrelation: `user_id uuid NOT NULL REFERENCES public.admin_profiles(id) ON DELETE CASCADE`.
- Actor: `requested_by uuid NOT NULL` ohne FK, damit die technische Actor-ID bei späterer Profilentfernung als Vorgangsevidenz erhalten bleibt; keine E-Mail-basierte Relation.
- Adressen: normalisiertes `old_email`/`new_email`, jeweils `text NOT NULL`, 3–254 Zeichen, voneinander verschieden; keine globale Adress-Unique-Regel.
- Token: ausschließlich `token_hash text NOT NULL`, Check auf exakt 64 kleingeschriebene Hexzeichen und globaler Unique-Index.
- Zustände: `pending`, `confirming`, `completed`, `cancelled`, `expired`, `failed`; der State-Check bindet Status, Lock-, Abschluss- und Fehlerfelder konsistent zusammen.
- Ablauf: `expires_at timestamptz NOT NULL` ohne Default; die spätere Anwendung setzt zentral 15 Minuten. `expires_at > created_at` wird geprüft.
- Race-Schutz: partieller Unique-Index auf `user_id` für `pending`/`confirming`; atomarer bedingter Claim `pending → confirming` ist schemafähig.
- Zeitfelder: `created_at`, `updated_at`, `confirmed_at`, `cancelled_at`, `expired_at`, `completed_at`, `locked_at`.
- Fehler: nur kurzer sanitiserter `failure_code`, niemals Providertext, Adresse, Token oder Stacktrace.
- Trigger: bestehendes `public.set_updated_at()` vor Updates.
- RLS/Grants: RLS aktiv, FORCE RLS aus, keine Policy, keine Rechte für `PUBLIC`/`anon`/`authenticated`, ausschließlich `SELECT/INSERT/UPDATE/DELETE` für `service_role`.
- Audit: keine Zweckentfremdung von `notification_audit`; Requestzustand, Zeitfelder und sanitisiertes Serverlogging genügen für E3.
- Retention: kein neuer Cron. Eine spätere Löschfrist für terminale Requests bleibt betrieblicher Go-live-Folgepunkt.

## Freigabe

Das Proposal ist nach Korrektur als **B – korrigiert und freigabefähig** klassifiziert. Es läuft vollständig in einer Transaktion. Ein zusätzlicher Guard stoppt bei unerwarteten gleichnamigen Indexrelationen; jede Kollision oder jeder spätere Fehler rollt die gesamte Anlage zurück. Es wird keine neue Funktion, Policy, Sequence oder SECURITY-DEFINER-Routine erzeugt.

Das Proposal wurde anschließend manuell ausgeführt. Der E3.2-Postcheck bestätigte den Schema- und Browser-Sicherheitsvertrag, zeigte jedoch drei durch Default Privileges verbliebene, für den Workflow unnötige `service_role`-Rechte. Der aktuelle Folgeschritt ist daher die in [`b15-23e3-db-postcheck-analysis.md`](b15-23e3-db-postcheck-analysis.md) dokumentierte minimale Grant-Korrektur; E3.3 bleibt bis zum Mini-Postcheck gesperrt.
