# B15.23C – Dashboard-Profiloberfläche: Analyse und freigabepflichtiges Design

## Finaler Status

B15.23C einschließlich C1–C4 ist vollständig abgeschlossen. Das SQL-Proposal wurde manuell erfolgreich ausgeführt und der Read-only-Postcheck bestätigt `nickname`, `phone`, `profile_image_media_asset_id`, FK/Index, Purpose `profile`, Usage `admin_profile/avatar`, `images/profile/...`, die engen Own-profile-/Last-login-RPCs, die entfernte breite Own-UPDATE-Policy, erhaltene Superadmin-Policies und das weiterhin service-role-only Media-Assignment. Weitere SQL-Änderungen sind nicht erforderlich.

Der manuelle B15.23C-Live-Preflight wurde am 27. August 2026 ausgewertet. Er bestätigte drei unveränderte `admin_profiles`, aktiviertes RLS ohne FORCE RLS, die breite eigene UPDATE-Policy, die bestehenden Select-/Superadmin-Policies sowie null bestehende Profile-Assets oder `admin_profile/avatar`-Usages. `nickname`, `phone`, Avatar-FK, Purpose `profile`, Storagepfad `images/profile/...` und Usage-Entity `admin_profile` fehlen live. Das Proposal wurde gegen diesen Stand finalisiert; es wurde weiterhin nicht ausgeführt.

Der erste manuelle Proposal-Versuch wurde vor jeder Mutation vom Storage-Constraint-Guard abgebrochen; die Transaktion erzeugte keinen neuen Datenbankstand. Ursache war ein zu formatierungsabhängiger Teilstringvergleich der Ausgabe von `pg_get_constraintdef`. Die drei Live-Constraints wurden anschließend read-only exakt bestätigt. Der Guard prüft nun die extrahierten Purpose-/Entity-Literalmengen beziehungsweise das isolierte Storage-Regex gegen den vollständigen bestätigten Altvertrag. Whitespace, Klammerformatierung und `::text`-Casts beeinflussen die Prüfung nicht; unbekannte, fehlende oder zusätzliche Vertragswerte führen weiterhin zum Abbruch.

Das korrigierte Proposal und der Read-only-Postcheck wurden anschließend manuell erfolgreich ausgeführt. Die C2-Anwendung integriert die live bestätigten Felder und RPCs. Name und Login-E-Mail sind im persönlichen Profil read-only; Nickname und Dashboard-Telefon laufen ausschließlich über den engen Own-profile-RPC. Profilbilder nutzen den zentralen privaten Media-Pfad und bleiben unabhängig von Trainer-/Vorstandsbildern. Normale Benutzer sehen serverseitig ausschließlich eigene aktive `profile`-Assets; die globale Media-Library-RLS wurde nicht geöffnet.

Im ersten C2-Browsertest bestanden Nickname, Telefon, Avatar und Headerdarstellung. Auch die Reset-E-Mail wurde zugestellt; ihr Link scheiterte jedoch am clientseitigen PKCE-Codeaustausch direkt auf `/admin/set-password`, weil der Code-Verifier dort nicht im erwarteten Storage-Kontext verfügbar war. C3 führt Recovery-Links deshalb über `/admin/auth/callback`: Die Route tauscht den Code mit `@supabase/ssr` serverseitig gegen eine cookiegebundene Session, setzt einen kurzlebigen HttpOnly-Recovery-Marker und leitet erst danach zur serverseitig geprüften Passwortseite weiter. Provider-/PKCE-Rohfehler werden nicht angezeigt. Der bestehende Invite-Initialpasswortpfad bleibt separat erhalten und entfernt seine einmaligen Hash-Werte unmittelbar aus der Adresszeile. Ein PKCE-Reset bleibt technisch an den Browser/Host gebunden, in dem er gestartet wurde; ein neuer Tab desselben Browsers teilt die Cookies, ein anderes Gerät besitzt den Verifier nicht. Der erneute manuelle Recovery-Test bleibt offen.

Das projektweite Supabase-Built-in-Mail-Limit blockierte den Endtest zwischenzeitlich, war aber kein Recovery-Fehler. C4 normalisiert `over_email_send_rate_limit` beziehungsweise „email rate limit exceeded“ in Reset-, Forgot-password- und Invite-Mailpfaden zu einem deutschen Hinweis ohne Providerdetails oder fest zugesagte Wartezeit. Nach Freigabe des Limits bestand der finale manuelle Recovery-Test: SSR-Callback, Passwortseite, Passwortspeicherung und anschließender Login funktionierten ohne PKCE-Fehler.

Der finale Desktop-/Mobile-Browsertest bestätigte außerdem Nickname, Telefonnummer, Upload/Auswahl/Wechsel/Entfernen des privaten Profilbilds, Header-Nickname/-Avatar, read-only Name/E-Mail, kompakte Rollen-/Funktionsdarstellung, entfernte Permission-/`created_at`-Anzeige und den Passwortbereich. Trainer-/Vorstandsbilder, Superadmin-Benutzerverwaltung, Rollenmatrix, Login, Logout und Invite-Vertrag bleiben unverändert.

## Nachgelagerte Live-Verifikation B15.23D

Der unveränderte Invite-Vertrag wurde in B15.23D vollständig live bestätigt. Ein neuer Testaccount wurde über die Superadmin-Benutzerverwaltung mit Primärrolle Fußball-Vorstand und zusätzlicher Rolle Trainer angelegt. Einladung und externe Zustellung über Supabase Auth Custom SMTP/Resend, Öffnen des Links, Weiterleitung zu `/admin/set-password`, Passwortvergabe, anschließender Login, Session, Dashboarddarstellung sowie Primär-/Sekundärrolle und bestehendes Permission-Verhalten waren erfolgreich. Es trat kein Fehler in Auth, Redirect, PKCE, Passwortvergabe oder Rollenzuordnung auf; Code-, SQL- und Datenbankkorrekturen waren nicht erforderlich.

Für die Entwicklungs-/Übergangsumgebung sind die Resend-Versanddomain `mail.mavermg.de`, DKIM und Sending-CNAMEs verifiziert. Das derzeit englische Supabase-Invite-Template gehört nicht zu B15.23D und bleibt für einen späteren zentralen Mailtemplate-/Corporate-Design-Block offen. Ebenso bleibt die Umstellung auf den finalen Vereins-Mailserver eine Go-live-Aufgabe.

## Ausgangsvertrag vor B15.23C

- Route: `/admin/profile`, geschützt über das bestehende Adminrouting mit `dashboard.view`.
- `AdminProfilePageShell` lädt den eigenen Auth-/Admin-Kontext derzeit clientseitig über `getCurrentAdminContext()` und ergänzt verknüpfte Coach-/Board-Daten anhand der bestehenden `admin_profile_id`-FKs.
- `ProfileSummaryCard` zeigt Name, Login-E-Mail, Status, primäre Rolle, letzte Anmeldung, Erstellzeit und verknüpfte Funktionskarten; technische Werte erscheinen teilweise zusätzlich.
- `ProfileRolesCard` zeigt primäre und weitere Rollen. `ProfilePermissionsCard` zeigt die komplette Permission-Liste. Dadurch sind Rollen/Funktionen doppelt beziehungsweise über mehrere Bereiche verteilt.
- `ProfileForm` erlaubt heute die Änderung von `admin_profiles.full_name` über den Browserclient. E-Mail ist dort read-only. Die historische Policy `admin_profiles_update_own_authenticated` begrenzt UPDATE nur auf die eigene Zeile, aber nicht auf einzelne Spalten.
- Passwortänderung verwendet `supabase.auth.updateUser`; Passwortreset verwendet den bestehenden Auth-Reset-Flow. Diese Logik bleibt erhalten. Die vorhandene Stärke- und Kriterienlogik ist korrekt, die Darstellung nur zu groß.
- `ProfileMenu` zeigt `full_name`, primäre Rolle, Status und einen generischen `UserCircle`; ein Dashboardavatar existiert nicht.
- `last_login_at` wird heute clientseitig auf dem eigenen Profil aktualisiert. `created_at` bleibt in der Superadmin-Benutzerverwaltung verfügbar.
- `full_name` wird außerdem für Session-/Dashboardanzeige und News-Autorennamen genutzt. Ein Dashboard-Nickname darf diese offiziellen Verwendungen nicht global ersetzen.

## Umgesetzte Schemaerweiterung

`admin_profiles` besitzt live laut Repository-Inventar nur `id`, `full_name`, `email`, `is_active`, `last_login_at`, `created_at` und `updated_at`. Erforderlich sind:

- `nickname text NULL`: getrimmt, 1–80 Zeichen oder NULL. Die normale React-Ausgabe bleibt escaped; es wird kein unnötiger HTML-Vertrag in das Datenmodell eingebaut.
- `phone text NULL`: getrennte optionale Dashboard-/Account-Kontaktangabe, getrimmt und maximal 40 Zeichen; keine Synchronisierung mit Auth-, Trainer-, Vorstands- oder Clubkontakt-Telefon.
- `profile_image_media_asset_id uuid NULL REFERENCES media_assets(id) ON DELETE SET NULL` plus partieller Index.

Die Live-Fakten zu Spalten, Constraints, Grants, RLS, Policies, Triggern, Media-Checks und zentraler Assignment-Funktion müssen zuerst mit dem manuellen Read-only-Preflight bestätigt werden.

## Security-Design

Offizieller Name, Login-/Profil-E-Mail, Aktivstatus, Rollen, Permissions sowie Coach-/Board-Verknüpfungen sind auf der persönlichen Profilseite unveränderbar. Der bestehende Superadmin-Benutzerverwaltungsweg bleibt erhalten.

Die zu breite Own-row-UPDATE-Policy wird im Proposal entfernt. Eigene Dashboardfelder werden über `update_own_dashboard_profile(text,text)` aktualisiert. Die Funktion:

- leitet die Ziel-ID ausschließlich aus `auth.uid()` ab,
- akzeptiert keine User-ID,
- normalisiert nur Nickname und Telefon,
- validiert dieselben Grenzen serverseitig,
- verändert keine anderen Profilfelder,
- ist nur für `authenticated` ausführbar.

Für die bestehende Loginzeit wird ein eigener enger RPC `touch_own_admin_profile_last_login()` vorbereitet, damit nach der späteren App-Umstellung kein allgemeines Own-row-UPDATE mehr nötig ist. Beide Funktionen sind `SECURITY DEFINER` mit festem `search_path`. Die feinere Anwendungsintegration erfolgt erst nach manueller SQL-Freigabe.

## Media-Design

- Zentrale Semantik: `entity_type = 'admin_profile'`, `field_name = 'avatar'`, `purpose = 'profile'`.
- Medienart: ausschließlich Bild, nicht archiviert.
- Speicherung: `media-library-private`, Visibility exakt `admin`; keine permanente öffentliche URL.
- Darstellung: vorhandene kurzlebige Signed-URL-Auflösung des server-only Media-Service.
- Assignment: Erweiterung von `synchronize_media_assignment`; EXECUTE bleibt service_role-only. Die spätere Server Action leitet die Profil-ID aus der Session ab und übergibt keine clientseitig autorisierende ID.
- Wechsel/Entfernung ersetzt beziehungsweise löscht nur FK/Usage. Das alte Asset bleibt bestehen und unterliegt weiter dem Archivschutz.
- Trainer-, Vorstands- und Kontaktbilder bleiben vollständig unabhängig.
- Der zentrale Storage-Path-Check wird ausschließlich um `images/profile/<uuid>.(jpg|png|webp)` erweitert; bestehende Bild- und Dokumentpfade bleiben erhalten.
- Normale authentifizierte Benutzer erhalten keine globale SELECT-Policy auf `media_assets` oder `media_asset_usages`. Der spätere serverseitige Profilpfad listet nur eigene Assets mit `uploaded_by_user_id = auth.uid()`, Purpose `profile`, Bildtyp, privatem Admin-Scope und `is_archived = false`. Superadmin-/Webmaster-Sicht bleibt unverändert.

## Geplantes UI nach SQL-Freigabe

1. Kompakter Profilkopf mit privatem Dashboardavatar, Nickname-Fallback auf offiziellen Namen, offiziellem Namen, Status und kleinem Primärrollen-Badge.
2. „Persönliches Dashboardprofil“: offizieller Name und Login-E-Mail read-only; Nickname und optionale Account-Telefonnummer editierbar; Profilbild über zentralen Picker/Upload änder- und lösbar.
3. „Rollen & Vereinsfunktionen“: primäre/weitere Rollen und vorhandene Coach-/Board-/Betreuerverknüpfungen gesammelt, nur lesbar und nur bei tatsächlichem Bestand.
4. „Sicherheit“: letzte Anmeldung bleibt sichtbar, inklusive Hinweis bei unbekanntem Zeitpunkt; Passwortfelder, Reset, kompakter Farbbalken und kompakte Kriterienliste behalten ihre bestehende Fachlogik.

Entfallen auf der persönlichen Seite: Permission-Liste, `created_at`, doppelte Rollen-/Funktionsdarstellung und die Editierbarkeit des offiziellen Namens. Die Superadmin-Benutzerverwaltung bleibt unverändert.

## Geplante Regression nach manueller SQL-Ausführung

Nickname setzen/ändern/leeren/trimmen und Grenzwerte; Telefon getrennt validieren; manipulierte User-ID wirkungslos; Fremdprofilmutation blockiert; Name/E-Mail/Status/Rollen unveränderbar; Profil-Picker nur aktive private `profile`-Bilder; Upload, Wechsel, Entfernen, Usage und Asset-Erhalt; Trainer-/Vorstandsbild unverändert; Signed-URL/Fallback im Profil und Accountmenü; Rollen/Funktionen nur lesbar; Passwortlogik unverändert; Login/Last-Login, Navigation, Notifications, Membership und Media-Archivschutz regressionsfrei.

## Manuelle Reihenfolge

1. `../sql/b15-23c-dashboard-profile-preflight-readonly.sql` manuell ausführen und Ergebnisse prüfen.
2. Proposal erst nach erneuter Codex-Auswertung ausdrücklich freigeben.
3. Danach Proposal manuell ausführen und unmittelbar den Read-only-Postcheck prüfen.
4. Erst nach bestätigtem Schema die Anwendung implementieren und im Browser testen.
