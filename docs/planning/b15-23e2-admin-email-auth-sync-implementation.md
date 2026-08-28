# B15.23E2 – Superadmin-E-Mail-Änderung mit Auth-/Profil-Synchronisierung

## Implementierter Vertrag

Die bestehende Benutzerbearbeitung besitzt einen separaten Vorgang „Login-E-Mail ändern“. Er ist nur im Edit-Dialog und nur für einen serverseitig erneut bestätigten aktiven Superadmin verfügbar. Das persönliche Profil bleibt read-only für offizielle Namen und Login-E-Mail; sein bestehender Own-Profile-RPC akzeptiert weiterhin ausschließlich Nickname und Telefonnummer.

Der Zielbenutzer wird ausschließlich über seine UUID adressiert. Der E-Mail-Pfad schreibt keine Rollen, Permissions, Coach-/Board-Links, Scopes, Namen, Aktivstatus, Nickname, Telefon, Avatar, `last_login_at`, Passwort, Metadaten oder Invite-Felder.

## Ablauf

1. Session, aktives Adminprofil, `users.edit` und aktive Superadmin-Rolle werden in der Server Action geprüft.
2. Die Ziel-UUID und neue Adresse werden serverseitig validiert; die Adresse wird getrimmt und kleingeschrieben, maximal 254 Zeichen akzeptiert.
3. Auth-Benutzer und Profil werden über dieselbe UUID geladen. Fehlende Zeilen, abweichende IDs oder nicht übereinstimmende normalisierte Ausgangsadressen führen fail-closed zum Abbruch.
4. Auth- und Profilbestand werden case-insensitive auf die Zieladresse geprüft. Fremde Adressen und Rohfehler werden nicht offengelegt.
5. Die Auth-Adresse wird über `auth.admin.updateUserById(userId, { email })` geändert und durch erneutes Laden derselben UUID verifiziert.
6. Danach wird ausschließlich `admin_profiles.email` derselben UUID geschrieben. Auth und Profil werden abschließend erneut geladen und verglichen.
7. Scheitert ein Schritt nach erfolgreicher Auth-Mutation, wird die zuvor verifizierte Auth-Adresse bestmöglich wiederhergestellt und erneut geprüft. Eine fehlgeschlagene oder nicht eindeutig verifizierbare Kompensation führt fail-closed zu einem bereinigten manuellen Prüfzustand. Logs enthalten nur eine technische Fehlerklasse, keine Adresse, Providerantwort oder Secrets.

Der Vorgang ist bewusst vom allgemeinen Benutzer-Speichern getrennt. Eine reine Login-E-Mail-Änderung schreibt deshalb keine Rollenzuordnung und keine sonstigen Profil- oder Personenfelder. Notification-Empfängerauflösung verwendet nach erfolgreicher Spiegelung automatisch die neue `admin_profiles.email`; E2 versendet keine Testmail.

## Offene manuelle Prüfungen

B15.23E bleibt bis zur Live-Abnahme offen:

- kontrollierter Browsertest mit einem Testbenutzer: neue Adresse speichern, Benutzerliste neu laden, alte Anmeldung negativ und neue Anmeldung positiv prüfen sowie Rollen, Nickname, Telefon, Avatar und Personenlinks vergleichen;
- Supabase-Dashboardeinstellung „Secure Email Change“ prüfen;
- kontrolliert bewerten, ob ein normaler Benutzer die Auth-Adresse außerhalb der Anwendung direkt per Supabase Self-Service ändern könnte. Eine reine Clientblockade gilt nicht als Sicherheitsgrenze.

Es wurde keine SQL-, Schema-, RLS-, Policy-, Grant-, RPC- oder Provideränderung vorgenommen.

## Fachliche Erweiterung durch E3

Der direkte E2-Flow wurde im manuellen Browsertest technisch bestätigt. Für den finalen Produktivvertrag darf er jedoch nicht mehr unmittelbar aus der UI gestartet werden. E3 stellt davor einen 15 Minuten gültigen, gehashten Einmal-Token- und Pending-Request-Prozess. Die alte Adresse bleibt bis zum Besitznachweis der neuen Adresse aktiv; erst der bestätigte serverseitige Finalize verwendet diese E2-Synchronisierung. E3.1 bereitet zunächst nur Preflight und Proposal vor: [`b15-23e3-confirmed-admin-email-change-design.md`](b15-23e3-confirmed-admin-email-change-design.md).

## Manueller Browsertest

1. Als Superadmin anmelden und unter `/admin/users` einen entbehrlichen Testbenutzer öffnen.
2. Rollen, Nickname, Telefon, Avatar und vorhandene Coach-/Board-Verknüpfung notieren.
3. Eine freie, nicht produktive Testadresse eintragen und „Login-E-Mail ändern“ genau einmal auslösen.
4. Benutzerverwaltung neu laden und die neue Adresse prüfen.
5. Abmelden; Login mit alter Adresse muss scheitern, Login mit neuer Adresse muss funktionieren.
6. Profil und Benutzerverwaltung öffnen und alle zuvor notierten Rollen-/Profil-/Personenwerte vergleichen.
7. Falls gewünscht, denselben kontrollierten Vorgang zur ursprünglichen Testadresse zurück durchführen.

Keine echte Vereinsadresse und keine automatisch ausgelöste Notification-/Testmail verwenden.
