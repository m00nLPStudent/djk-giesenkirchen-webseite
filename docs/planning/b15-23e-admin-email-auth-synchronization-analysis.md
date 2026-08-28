# B15.23E – Administrative E-Mail-Änderung und Auth-Synchronisierung

## Status und Grenze von E0

B15.23E befindet sich nach E0 ausschließlich im Analysezustand. Es wurde keine E-Mail geändert, kein Auth-Benutzer angelegt oder ersetzt, kein SQL ausgeführt und weder Anwendungscode noch Rollen-, Permission-, Invite-, Recovery-, SMTP-, Trainer-, Vorstands- oder Profilarchitektur verändert. Die Implementierung ist ausdrücklich noch nicht freigegeben.

## Bestehender Vertrag

Supabase `auth.users` ist die Source of Truth für Login, Passwort, Recovery und Session. `public.admin_profiles` verwendet dieselbe UUID als Account-/Rollenidentität und hält mit `email` zusätzlich die operative Dashboard-Adresse. Diese zweite Kopie wird in Benutzer- und Rollenansichten, als Autorenfallback, bei Workflow-Empfängerauflösung und insbesondere für Notification-E-Mail-Delivery gelesen. Trainer-, Vorstands- und Clubkontakt-E-Mails bleiben fachlich getrennte Kontaktadressen.

Der Create-Flow normalisiert die Adresse, prüft sie gegen `admin_profiles`, erzeugt über die server-only Admin-API `inviteUserByEmail` den Auth-Benutzer und legt anschließend `admin_profiles` mit derselben UUID und Adresse an. Fehler nach der Auth-Anlage werden über Auth-/Profil-Cleanup kompensiert. Rollen werden ausschließlich über `admin_user_roles.user_id` an diese UUID gebunden.

Der Edit-Flow bietet die E-Mail eines bestehenden Benutzers read-only an. Obwohl der normalisierte Form-Payload weiterhin `email` enthält, wertet `saveAdminUserAction` bei bestehenden Benutzern ausschließlich Namen, Aktivstatus, Rollen und explizite Kartenlinks aus. Es existiert weder ein Aufruf von `auth.admin.updateUserById` noch ein Update von `admin_profiles.email`. Eine administrative E-Mail-Änderung ist daher heute nicht implementiert.

## Identitäts- und Fallbackinventar

- Login verwendet `auth.signInWithPassword` und damit die Auth-E-Mail.
- Recovery verwendet bevorzugt `context.user.email`, ersatzweise `context.profile.email`.
- Profilanzeige und Accountmenü bevorzugen ebenfalls die Auth-E-Mail.
- `resolveAdminProfileForAuthUser` sucht zuerst strikt `admin_profiles.id = auth.users.id`. Nur wenn keine ID-Zeile gefunden wird, folgt ein normalisierter Lookup über `admin_profiles.email = auth.users.email`.
- Mehrere historisch installierte RLS-Policies prüfen weiterhin `admin_profiles.id = auth.uid()` **oder** die Übereinstimmung von `admin_profiles.email` und `auth.jwt()->>'email'`. Repository-Nachweise bestehen unter anderem für Kategorie-, Teamtemplate-, Download-, Notification-Audit- sowie Trainer-/Vorstand-/Kontakt-Policies.
- Rollen und Permissions werden über `admin_user_roles.user_id` und Rollen-/Permission-IDs geladen. E-Mail ist dafür kein Join-Key.
- Team-/Person-Scopes lösen Coach und Board über deren explizites `admin_profile_id` auf. Saison- und manuelle Teamzuweisungen verwenden ebenfalls IDs.
- Die Superadmin-Match-Hilfe vergleicht normalisierte Profil-, Coach- und Board-E-Mails, erstellt aber niemals automatisch eine Verknüpfung. Die verbindliche Zuordnung bleibt die explizite `admin_profile_id`.
- Name ist Anzeigeinhalt beziehungsweise Bestandteil von Kartenlabels, aber kein nachgewiesener Identitäts-, Rollen-, Scope- oder Autorisierungsfallback.

Eine vorübergehende Abweichung zwischen Auth und Profil zerstört bei einem regulär ID-konsistenten Benutzer nicht dessen Rollen oder Scopes, weil die UUID-Pfade zuerst beziehungsweise zusätzlich greifen. Sie ist dennoch fachlich unzulässig: Login/Recovery können dann eine andere Adresse als Notification-Delivery, Benutzerverwaltung oder Match-Hilfe verwenden. Bei historischen Profilen ohne passende Auth-UUID kann der E-Mail-Fallback sogar über die gefundene Profilidentität entscheiden.

## Sicherheitsbewertung

Der vorhandene Anwendungsweg erlaubt nur Superadmins die Benutzerbearbeitung über `users.edit`; die explizite Kartenlinkverwaltung prüft Superadmin zusätzlich. Ein normaler Benutzer kann über die enge B15.23C-RPC nur eigenen Nickname und eigene Telefonnummer ändern. Offizieller Name, E-Mail, Aktivstatus und Rollen gehören nicht zu deren Parametern. Das Avatar-Assignment bleibt separat und ID-gebunden.

Im Repository existiert kein UI-, Action- oder Servicepfad, der für normale Benutzer `auth.updateUser({ email })` aufruft. Ein authentifizierter Benutzer könnte die allgemeine Supabase-Auth-Self-Service-API jedoch grundsätzlich direkt ansprechen, sofern die Live-Auth-Providerkonfiguration E-Mail-Änderungen zulässt. Das Repository kann diese Dashboardeinstellung nicht beweisen. Eine solche Auth-only-Änderung würde `admin_profiles.email` nicht mitsynchronisieren und ist deshalb im Live-Preflight beziehungsweise kontrollierten Negativtest ausdrücklich zu prüfen.

Risiken eines späteren Adminpfads sind eine bereits in Auth oder `admin_profiles` belegte Zieladresse, ungültige oder nicht normalisierte Eingaben, Auswahl der falschen UUID, Teilfehler zwischen Auth und Datenbank, unklare Bestätigungssemantik, veraltete E-Mail-Claims bestehender Sessions, fehlgeleitete Recovery-/Notification-Mails sowie das Protokollieren alter oder neuer Adressen. Eine Datenbanktransaktion kann Auth Admin API und Postgres nicht atomar verbinden.

## Einordnung nach E1.1

E0 wurde zunächst als **D** eingeordnet, weil Live-Konsistenz und tatsächliche E-Mail-Abhängigkeiten noch unbekannt waren. Der am 27./28. August 2026 manuell ausgeführte und anhand lokaler, nicht versionierter CSV-Exporte ausgewertete E1-Preflight hebt diese Unsicherheit auf: Vier Auth-Benutzer und vier Profile sind vollständig UUID-konsistent, normalisierte Auth-/Profiladressen stimmen überein und es bestehen keine case-insensitive Konflikte. Alle 31 tatsächlich E-Mail-abhängigen Policies sind UUID-first mit E-Mail nur als zusätzlichem Fallback; kritische E-Mail-only-Autorisierung und automatische Auth-/Profil-Synchronisierung wurden nicht gefunden.

Die finale Architekturklassifizierung ist daher **A**. Ein server-only, kompensierter E2-Pfad kann ohne DB-/Schemaänderung umgesetzt werden. Der gegenwärtige Datenbestand ist überwiegend Testdaten; nur der persistierende Superadmin ist für eine spätere reale Adressumstellung besonders relevant. Die Supabase-Self-Service-/Secure-Email-Change-Konfiguration bleibt ein manueller Konfigurations- und Negativtestpunkt.

## Minimaler Folgeweg

1. Einen neuen read-only Live-Preflight ausführen: Auth-/Profil-ID-Konsistenz, normalisierte Abweichungen und Dubletten ausschließlich als Zähler, Constraints/Indizes, RLS/Policies/Grants/Funktionen sowie aktuelle Auth-Konfiguration soweit ohne Secrets nachweisbar inventarisieren. Keine Personenadressen ausgeben.
2. Erst danach den fachlichen Vertrag bestätigen: administrative Änderung ausschließlich durch Superadmin; Auth-E-Mail bleibt Login-Source; `admin_profiles.email` bleibt synchroner operativer Spiegel; Trainer-/Vorstands-/Kontaktadressen werden nicht verändert. Außerdem ausdrücklich entscheiden, ob die neue administrative Adresse sofort als bestätigt gilt oder einen separaten Bestätigungsprozess benötigt.
3. Falls der Live-Stand keine Schema-/RLS-Lücke zeigt, einen kleinen server-only Service-Role-Pfad planen: Ziel-UUID und aktuellen Auth-/Profilstand erneut laden, Adresse normalisieren/validieren, Unverändertheit erkennen, Zielkonflikte fail-closed behandeln und Auth über `auth.admin.updateUserById` an derselben UUID ändern.
4. `admin_profiles.email` anschließend gezielt über dieselbe UUID synchronisieren und beide Seiten erneut verifizieren. Bei Profilfehler die Auth-Adresse bestmöglich auf den zuvor gelesenen Wert kompensieren; bei gescheiterter Kompensation einen bereinigten, expliziten manuellen Prüfzustand melden. Weder Rohadressen noch Providerdetails loggen.
5. Rollen, Permissions, `admin_profile_id`-Links, Team-/Person-Scopes, Nickname, Telefon, Avatar und `last_login_at` nicht in den Änderungspayload aufnehmen. Aktive Sessions und Login mit alter/neuer Adresse kontrolliert testen.
6. Keine E-Mail-Fallbacks in diesem Minimalblock entfernen. Deren Ablösung wäre ein eigener Security-/Cleanup-Block nach vollständigem Live-Inventar.

Der Live-Preflight bestätigt, dass dafür keine DB-, RLS-, Policy-, Grant-, RPC- oder Schemaänderung notwendig ist. Es wird kein Proposal, Rollback oder Postcheck erzeugt. Einzelheiten und aggregierte Live-Zahlen stehen in [`b15-23e1-admin-email-auth-sync-live-analysis.md`](b15-23e1-admin-email-auth-sync-live-analysis.md).

## Erforderliche Regressionen für einen späteren Implementierungsblock

Superadmin-only; normaler Benutzer und direkter manipulierter Action-Aufruf abgewiesen; gleiche Adresse als No-op; ungültige und bereits belegte Adresse abgewiesen; Auth-Fehler ohne Profiländerung; Profilfehler mit erfolgreicher und fehlgeschlagener Auth-Kompensation; gleiche User-/Profil-ID; unveränderte Primär-/Zusatzrollen, Permissions, Coach-/Board-Links, Team-Scopes, Nickname, Telefon, Avatar und Last-Login; Notification-Delivery nutzt danach die neue Profiladresse; alte Adresse kann nicht mehr, neue Adresse kann anmelden; Recovery verwendet die neue Adresse; bestehende Sessionsemantik kontrolliert; keine Adresse oder Secrets in Logs; Invite-, Set-Password- und PKCE-Recovery unverändert.

## E2-Implementierungsstand

Der unter E1.1 freigegebene Architekturweg ist in E2 implementiert. Der E-Mail-Vorgang ist vom allgemeinen Benutzerspeichern getrennt und schreibt ausschließlich `auth.users.email` über die Admin API sowie danach `admin_profiles.email` derselben UUID. Ausgangskonsistenz, Auth-/Profilkonflikte, Auth-first-Verifikation, Profilverifikation und Auth-Kompensation sind serverseitig abgedeckt. Details und manueller Testplan: [`b15-23e2-admin-email-auth-sync-implementation.md`](b15-23e2-admin-email-auth-sync-implementation.md). B15.23E bleibt bis zum Browsertest und zum Supabase-Self-Service-/Secure-Email-Change-Check offen.

Der E2-Browsertest war erfolgreich. E3 erweitert den fachlichen Sicherheitsvertrag dennoch: Der direkte Pfad bleibt interne Finalize-Logik und darf künftig erst nach einem server-only Pending-Request mit gehashtem Einmal-Token, 15 Minuten TTL und Bestätigung der neuen Mailbox laufen. E3.1 enthält noch keine Produktverdrahtung und keine ausgeführte Migration. Design: [`b15-23e3-confirmed-admin-email-change-design.md`](b15-23e3-confirmed-admin-email-change-design.md).
