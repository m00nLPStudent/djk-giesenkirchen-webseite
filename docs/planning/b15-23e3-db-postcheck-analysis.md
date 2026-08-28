# B15.23E3.2 – Live-Postcheck und DB-Sicherheitsvertrag

## Ausführungsgrenze

Das E3-Tabellenproposal und anschließend der vorbereitete read-only Postcheck wurden am 28. August 2026 manuell im Supabase SQL Editor ausgeführt. Diese Auswertung liest ausschließlich die neun aktuellen CSV-Dateien in `.local/db-preflight` sowie den zusätzlich manuell bestätigten leeren Policy-Befund. Codex hat weder SQL ausgeführt noch die Datenbank verändert. Die CSVs wurden nicht verändert oder gestaged.

## Live-Vertrag

`public.admin_email_change_requests` existiert als Tabelle mit RLS aktiv und FORCE RLS aus. Alle 16 erwarteten Spalten, neun Constraints, fünf Indizes, der UUID-FK auf `admin_profiles(id) ON DELETE CASCADE`, der globale Token-Hash-Unique-Index, der partielle Ein-aktiv-pro-Benutzer-Index sowie der bestehende `set_updated_at()`-Trigger stimmen mit dem Proposal überein. Der Token-Hash ist NOT NULL, auf exakt 64 kleingeschriebene SHA-256-Hexzeichen beschränkt und global eindeutig; ein Klartexttoken-Feld existiert nicht. Der Ausgangsbestand ist null.

Der Policy-Postcheck wurde als leeres Resultset bestätigt: Es existieren exakt null Policies. `anon` und `authenticated` besitzen weder direkte noch effektive SELECT-, INSERT-, UPDATE-, DELETE-, REFERENCES-, TRIGGER- oder TRUNCATE-Rechte. Browserclients einschließlich eines Superadmins können daher nicht direkt auf die Tabelle zugreifen. Das beabsichtigte server-only Modell ist wirksam.

## Service-Role-Grant-Abweichung

Der Live-Postcheck weist für `service_role` direkte und effektive Rechte auf SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER und TRUNCATE aus. Das ausgeführte E3-Proposal enthält nur einen ausdrücklichen CRUD-Grant. Die drei Zusatzrechte wurden nicht durch dessen `GRANT SELECT, INSERT, UPDATE, DELETE` erzeugt. Sie stammen aus den beim Erstellen der Tabelle angewendeten Supabase/PostgreSQL-Default-Privileges: Das Proposal widerrief `ALL` nur von `PUBLIC`, `anon` und `authenticated`, nicht aber von `service_role`. Ein nachfolgender engerer GRANT reduziert einen bereits bestehenden ACL-Eintrag nicht.

Die Ausgabe in `information_schema.role_table_grants` und die positiven `has_table_privilege`-Ergebnisse belegen echte tabellenspezifische Rechte. Es handelt sich nicht bloß um Darstellung, Rollenvererbung oder Table Ownership. `service_role` ist zwar ein strikt serverseitiger, hochprivilegierter Schlüssel, dennoch benötigen E3 und dessen Servicepfad REFERENCES, TRIGGER und insbesondere TRUNCATE nicht. Der gefahrlose tabellenspezifische Entzug verbessert daher Least Privilege ohne den benötigten CRUD-Vertrag zu beeinträchtigen.

## Klassifizierung und nächster Schritt

Das minimale Proposal [`../sql/b15-23e3-admin-email-change-request-grants-fix-proposal.sql`](../sql/b15-23e3-admin-email-change-request-grants-fix-proposal.sql) wurde anschließend manuell ausgeführt. Der Grant-Mini-Postcheck bestätigte: `service_role` besitzt ausschließlich SELECT, INSERT, UPDATE und DELETE; REFERENCES, TRIGGER und TRUNCATE sind entzogen. `anon` und `authenticated` bleiben vollständig ohne Rechte.

Finale Klassifizierung: **A – DB-Vertrag vollständig korrekt, E3.3 freigegeben**. RLS, null Policies, Browserblockade, service-only CRUD, Token-/Status-/Race-Vertrag, Trigger und null Ausgangszeilen sind live bestätigt.
