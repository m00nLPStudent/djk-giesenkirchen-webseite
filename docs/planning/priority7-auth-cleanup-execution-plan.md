# Priority 7 – Auth Cleanup Execution Plan

Status: **COMPLETE – FIVE USERS DELETED SEQUENTIALLY / AUTH FOUNDATION VERIFIED**

## Bestehender Mechanismus

Die bestehende serverseitige Auth-Verwaltung erzeugt einen nicht persistierenden Supabase-Client mit `SUPABASE_SERVICE_ROLE_KEY`. Der vorhandene Helper `deleteAdminAuthUserById(userId)` ruft `client.auth.admin.deleteUser(userId)` auf und wird bisher ausschließlich zur Kompensation einer fehlgeschlagenen Benutzeranlage verwendet. Das Dashboard bietet regulär nur Deaktivierung und keinen physischen Delete. Der Cleanup verwendet später denselben Admin-API-Vertrag; es entsteht kein direkter SQL-Delete auf `auth.users` und keine browserseitige Löschstrecke.

## Relationaler Keep-Vertrag

Der Keep-Superadmin ist genau die Schnittmenge aus vorhandenem `auth.users`-Datensatz, aktivem `admin_profiles`-Profil, vorhandener `admin_user_roles`-Bindung und aktiver `admin_roles.key = 'superadmin'`-Rolle. Weder E-Mail noch UUID werden als Identität verwendet. Die Ausführung bleibt gesperrt, wenn diese Menge nicht exakt eine ID oder die Differenz aus allen Auth-Usern und dieser Menge nicht exakt fünf IDs enthält.

Der Read-only Dry Run gibt keine Kandidaten-UUIDs aus. Eine spätere serverseitige Ausführung muss die IDs unmittelbar vor der Mutation erneut relational laden, im Arbeitsspeicher halten und darf sie weder loggen noch dokumentieren.

## Abhängigkeiten

Der Repositoryvertrag erwartet, dass das Löschen eines Auth-Users dessen Profil und Rollenbindungen über die live vorhandenen Foreign Keys kaskadiert. Notifications und Preferences besitzen historisch `CASCADE`-Referenzen auf `auth.users`, Actor-Referenzen verwenden `SET NULL`. Profilbezogene Autoren-/Updater- und Media-Owner-Felder sind als `SET NULL` modelliert. `notification_audit` besitzt nach dem Audit-Hardening keine löschende Auth-FK-Kaskade und muss bei 25 Zeilen unverändert bleiben.

Der Dry Run inventarisiert die tatsächlichen Live-FKs erneut. Jede unbekannte `RESTRICT`-/`NO ACTION`-Referenz, jede Abweichung vom erwarteten Cascade-/Set-Null-Vertrag oder jede Foundation-Abweichung stoppt die Freigabe. Media Assets, Media Usages, Storage Objects und Buckets werden in dieser Stufe nicht gelöscht.

## Manuelle Freigabekette

1. Ausschließlich `docs/sql/b15-priority7-auth-cleanup-dry-run-readonly.sql` im Supabase SQL Editor ausführen und alle acht Resultsets privat sichern.
2. P7A.01, P7A.02, P7A.07 und P7A.08 müssen vollständig wahr sein. P7A.03 muss genau fünf Kandidatenordnungen ohne aktive Superadminrolle zeigen.
3. P7A.04/P7A.05 gegen den erwarteten FK-Vertrag prüfen. Unbekannte oder blockierende Abhängigkeiten stoppen den Ablauf.
4. Erst nach separater Betreiberfreigabe eine server-only Ausführung bereitstellen beziehungsweise starten. Keine Browseraction und kein SQL auf `auth.users`.
5. Unmittelbar vor dem ersten Delete Keep-ID und exakt fünf Kandidaten erneut relational bestimmen. Bei Drift abbrechen.
6. Kandidaten deterministisch, aber ohne Ausgabe ihrer IDs einzeln mit `auth.admin.deleteUser(userId)` löschen. Kein `Promise.all`, kein Bulk-Delete.
7. Nach jedem einzelnen Delete Auth-User, aktives Keep-Profil und aktive Superadminbindung erneut prüfen. Bei Provider-/FK-/Verifikationsfehler sofort stoppen und keine weiteren Kandidaten bearbeiten.
8. Nach fünf erfolgreichen Deletes den Read-only Postcheck `docs/sql/b15-priority7-auth-cleanup-postcheck-readonly.sql` ausführen. Exakt ein Auth-User und Profil, kein Fremduser sowie die unveränderte Foundation sind Pflicht.

## Fehlervertrag

Ein Fehler stoppt die Sequenz sofort. Der Bericht nennt ausschließlich die Anzahl bereits erfolgreicher Deletes und eine sanitierte Fehlerklasse. Er enthält keine UUID, E-Mail, Providerantwort, Tokens oder sonstige personenbezogene Daten. Es gibt keinen automatischen Retry und keine improvisierte relationale Bereinigung. Der Keep-Superadmin wird nach dem Stopp erneut read-only verifiziert.

## Unveränderte Baseline

- Auth User vor Cleanup: 6
- Keep-Superadmin: exakt 1
- Delete Candidates: exakt 5
- Rollen: 13
- Permissions: 64
- Role-Permission-Matrix: 249
- Departments: 4
- Seasons: 2
- Notification Audit: 25
- Notification-Mailsettings, Membership-Routing und Club Settings: vorhanden

Der Superadmin-Avatar ist kein Keep-Ziel, wird im Auth-Schritt aber nicht aktiv gelöscht. Seine kontrollierte Entkopplung gehört zur späteren Media-/Storage-Stufe.

## Ausgeführter Live-Lauf

Der Betreiber hat den Preflight mit 6 Auth-Usern, exakt einem Keep-Superadmin,
fünf Delete Candidates, 13 CASCADE- und 19 SET-NULL-FKs sowie ohne
RESTRICT-/NO-ACTION-Blocker freigegeben. Die fünf Kandidaten wurden anschließend
einzeln über `auth.admin.deleteUser(userId)` entfernt. Nach jedem Delete waren
Keep-Auth-User, aktives Keep-Profil, Superadminbindung sowie die gesamte
Foundation intakt und der Auth-Count sank exakt um eins.

Der finale read-only API-Abgleich bestätigt 1 Auth-User, 1 Profil, 1 relationalen
Keep-Superadmin, 0 Fremduser und 0 verwaiste Rollenbindungen. Rollen 13,
Permissions 64, Rollen-Permissions 249, Departments 4, Seasons 2,
Notification Audit 25 sowie Mailsettings, Club Settings und Membership-Routing
sind unverändert vorhanden.

Media Assets blieben bei 33. Media Usages sanken erwartungsgemäß von 19 auf 11:
Der vorhandene Trigger `admin_profile_cleanup_media_usage` entfernte beim
Cascade-Löschen der Profile acht `admin_profile/avatar`-Usages. Eine solche
Usage für das Keep-Profil bleibt vorhanden. Es wurden keine Assets,
Storage-Objekte oder Buckets aktiv gelöscht. Die danach separat freigegebene
Media-/Storage-Stufe sowie der finale Gesamtpostcheck und die manuellen
Abschlussprüfungen sind inzwischen vollständig bestanden.
