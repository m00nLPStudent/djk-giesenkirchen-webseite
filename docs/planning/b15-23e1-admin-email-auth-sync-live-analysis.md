# B15.23E1 – Admin-E-Mail/Auth-Synchronisierung: Live-Preflight-Auswertung

## Status B15.23E1.1

Das read-only Preflight-Skript unter [`../sql/b15-23e1-admin-email-auth-sync-preflight-readonly.sql`](../sql/b15-23e1-admin-email-auth-sync-preflight-readonly.sql) wurde am 27./28. August 2026 manuell im Supabase SQL Editor ausgeführt. Die 17 lokal exportierten CSV-Dateien wurden in B15.23E1.1 ausschließlich lesend ausgewertet. Sie liegen unter `.local/db-preflight`, werden durch `/.local/` in `.gitignore` geschützt und sind kein Repository-Artefakt. Weder Rohadressen noch Auth-UUIDs wurden in diese Dokumentation übernommen.

Die Exporte lassen sich den Abfragen 1 bis 11 sowie 13 zuordnen; die Mehrfachresultsets der Abfragen 6, 8, 9 und 10 tragen Dateisuffixe. Für Abfrage 12 zu Views, Materialized Views und Rules liegt keine CSV-Datei vor. Die zeitlich lückenlose Exportfolge von 11 zu 13 ist mit einem leeren Resultset vereinbar, beweist es aber nicht unabhängig. Deshalb wird technisch kein relevanter View-Befund behauptet; vor einem späteren Cleanup kann Abfrage 12 bei Bedarf nochmals manuell mit bestätigtem `0 rows` ausgeführt werden. Dieser Restpunkt blockiert den minimalen UUID-basierten Änderungspfad nicht.

## Live-Befund

- `auth.users`: 4, `admin_profiles`: 4, ID-Matches: 4.
- Auth-Benutzer ohne Profil: 0; Profile ohne Auth-Benutzer: 0; gleiche E-Mail unter anderer UUID: 0.
- Normalisierte Auth-/Profil-E-Mail-Abweichungen derselben UUID: 0. Die Abfrage vergleicht `lower(btrim(...))` und deckt damit Groß-/Kleinschreibung sowie Rand-Leerzeichen ab.
- Case-insensitive Dublettengruppen in Auth: 0; in Profilen: 0; konfliktbehaftete Profilpaare: 0.
- `admin_profiles.email` ist `NOT NULL` und besitzt einen normalen Unique-Constraint. `auth.users` besitzt den Supabase-Unique-Index für Nicht-SSO-Benutzer sowie den Instanz-/Lower-E-Mail-Index. Die zusätzlichen normalisierten Konfliktzähler sind für den späteren Serverpfad weiterhin erforderlich.
- Die stabilen Beziehungen sind intakt: sechs Rollenlinks, zwei Coach-Links und keine Board-Links. Nickname, Telefon und Avatar sind vorhandene, von einer E-Mail-Änderung unabhängige Profilfelder. Die Zahlen beschreiben den gegenwärtigen Testdatenstand, nicht eine produktive Migration.

Mit Ausnahme des bestehenden Superadmins sind die aktuellen Accounts Testbenutzer und werden vor Go-live entfernt. Der vollständig konsistente Live-Zustand zeigt kein strukturelles Migrationsproblem. Für den dauerhaft bestehenden Superadmin muss die spätere Umstellung auf eine Vereinsadresse trotzdem denselben kontrollierten Synchronisierungspfad verwenden.

## Policies, Routinen und Trigger

Der Export enthält 41 durch die breite E-Mail-/JWT-Suche erfasste Policies. Davon sind 31 tatsächlich JWT-E-Mail-abhängig. Jede dieser 31 Policies bindet das Profil primär über `profile.id = auth.uid()` und verwendet die normalisierte JWT-E-Mail nur als zusätzlichen `OR`-Fallback. Klassifizierung: 10 Policies **A** (keine E-Mail-Identität), 31 Policies **B** (zusätzlicher Fallback), 0 **C**, 0 **D**. Nach einer synchronisierten Änderung beider E-Mail-Kopien bleiben diese Fallbacks korrekt; ihre Entfernung ist kein Bestandteil von E2.

Zwei Routinen wurden gefunden: `auth.jwt()` ist eine infrastrukturelle Claims-Hilfe (**A**). `enforce_download_publish_permission()` ist UUID-first und verwendet denselben E-Mail-Fallback (**B**); sie ist `SECURITY DEFINER`, hat einen festen `search_path`, ist für Browserrollen nicht direkt ausführbar und wird durch den Download-Trigger aufgerufen. Es gibt keine kritische Routine der Klassen C/D.

Vier relevante Trigger wurden exportiert: Media-Usage-Cleanup für `admin_profiles`, Download-Publish-Permission sowie zwei `updated_at`-Trigger für Notification-E-Mail-Einstellungen. Kein Trigger liegt auf `auth.users`, keiner synchronisiert E-Mail-Felder und keiner koppelt `auth.users.email` automatisch an `admin_profiles.email`. Eine automatische Auth-/Profil-E-Mail-Synchronisierung existiert somit nicht.

## Self-Service-Restprüfung

Repositoryseitig existiert kein `auth.updateUser({ email })`-Pfad für normale Benutzer. SQL-Kataloge und CSV-Exporte beantworten jedoch nicht belastbar, ob die Supabase-Auth-Konfiguration direkte Self-Service-E-Mail-Änderungen akzeptiert und welche Secure-Email-Change-/Bestätigungssemantik gilt. Dashboardprüfung und späterer kontrollierter Negativtest bleiben vor der finalen E2-Abnahme verpflichtend; es wird keine Konfiguration geraten oder verändert.

## Teilfehler- und Kompensationsmodell

Vor einer späteren Mutation müssen Auth- und Profilzeile strikt über dieselbe UUID geladen, die aktuelle Übereinstimmung bestätigt, die Zieladresse normalisiert und unverändert beziehungsweise konfliktbehaftet fail-closed erkannt werden. Auth wird zuerst über die Admin-API geändert, weil dort Login-Identität und Auth-Uniqueness liegen. Erst nach verifizierter Auth-Antwort darf `admin_profiles.email` über dieselbe UUID gespiegelt und erneut gelesen werden.

Scheitert der Profilspiegel, ist die zuvor gelesene Auth-Adresse über dieselbe Admin-API bestmöglich wiederherzustellen und anschließend auf beiden Seiten zu verifizieren. Scheitert auch die Kompensation, muss der Vorgang fail-closed einen expliziten manuellen Prüfzustand melden; weitere Rollen-, Profil-, Notification- oder Personenmutationen dürfen nicht folgen. Logs dürfen nur Schritt, Ziel-UUID, normalisierte Fehlerklasse sowie Erfolg/Fehlschlag von Mutation, Verifikation und Kompensation enthalten, niemals alte/neue Rohadresse, Token, Providerantwort oder Secrets.

Das Partial-Failure-Risiko bleibt wegen der fehlenden gemeinsamen Transaktion zwischen Auth Admin API und Postgres **hoch**, ist mit diesem Ablauf aber kontrollierbar. Die Live-Daten zeigen kein zusätzliches Risiko.

## Finale Einordnung

B15.23E1.1 wird als **A** klassifiziert: Die Live-Daten bestätigen UUID-Konsistenz, intakte ID-basierte Rollen-/Personenlinks, konfliktfreie normalisierte Adressen, UUID-first Policies/Routinen und das Fehlen konkurrierender Synchronisationsautomatik. Für E2 ist keine DB-/Schemaänderung erforderlich. Es wird daher kein Migrationsproposal erzeugt.

B15.23E insgesamt bleibt offen. E2 darf als kleiner, server-only und Superadmin-only Implementierungsblock geplant werden.

## Nächster Schritt

B15.23E2 wurde entsprechend dieser Freigabe implementiert: stabile Ziel-UUID, Auth-first-Update, schmale Profilspiegelung, doppelte Verifikation, Konfliktprüfung und verifizierte Auth-Kompensation. Rollen, Coach-/Board-Links, Scopes und sonstige Profilfelder bleiben außerhalb des E-Mail-Pfads. Vor der finalen Freigabe stehen der kontrollierte Browsertest und die manuelle Supabase-Self-Service-/Secure-Email-Change-Prüfung aus. Details: [`b15-23e2-admin-email-auth-sync-implementation.md`](b15-23e2-admin-email-auth-sync-implementation.md).
