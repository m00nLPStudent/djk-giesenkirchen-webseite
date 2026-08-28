# B15.23E3.3 – Bestätigter Admin-E-Mail-Wechsel: Implementierung

## Produktvertrag

Die Superadmin-Benutzerverwaltung aktiviert eine neue Login-Adresse nicht mehr unmittelbar. Die autorisierte Server Action prüft Session, aktiven Actor, `users.edit`, aktive Superadmin-Rolle und stabile Ziel-UUID und startet anschließend ausschließlich einen serverseitigen Pending-Request. Auth und `admin_profiles.email` bleiben bis zur bewussten Bestätigung unverändert.

Der Request-Service prüft Auth-/Profil-Ausgangskonsistenz und beide case-insensitiven Zielkonflikte. Abgelaufene Pending-Requests werden als `expired` terminalisiert, gültige Pending-Requests als `cancelled` ersetzt; ein `confirming`-Request blockiert einen neuen Vorgang. Ein kryptografischer 32-Byte-Token wird URL-safe erzeugt. Nur sein SHA-256-Hash wird gespeichert. Die zentrale TTL beträgt 15 Minuten.

## Mails

Nach dem Insert wird zuerst die Sicherheitswarnung ohne Link an die alte Adresse und anschließend der Bestätigungslink ausschließlich an die neue Adresse gesendet. Scheitert eine dieser sicherheitsrelevanten Mails, wird der Request `failed`; nach einem Warnmailfehler wird keine Bestätigungsmail versucht. Providerdetails gelangen weder in UI noch Logs.

Nach erfolgreicher Finalisierung erhalten alte und neue Adresse getrennte Abschlussinformationen. Diese nachgelagerten Mailfehler rollen eine bereits verifizierte Accountänderung nicht zurück. Alle vier Nachrichten verwenden die bestehende providerneutrale Mailabstraktion und stabile Idempotency-Keys. Es handelt sich ausdrücklich nur um technische Übergangstemplates. Das zentrale Corporate-Design-Mailtemplate mit Logo, Vereinskopf, responsivem rot/weiß/schwarzem Layout und vollständigem Footer bleibt ein späterer Block.

## GET-, POST- und Race-Schutz

`/auth/confirm-email-change?token=…` ist öffentlich und benötigt keine Session. Der Server-Component-GET hasht den Token und liest lediglich Status und Ablauf. Er verbraucht keinen Token, setzt weder `confirmed_at` noch `locked_at` und verändert Auth oder Profil nicht. Erst der bewusste Formularbutton ruft eine POST-Server-Action auf.

Der POST claimt atomar genau eine noch nicht abgelaufene `pending`-Zeile durch ein bedingtes Update auf `confirming` mit `confirmed_at` und `locked_at`. Double Click, Replay und parallele Bestätigungen erhalten keine Zeile und führen keine zweite Finalisierung aus. Ein abgelaufener Pending-Request darf erst in der POST-Phase als `expired` terminalisiert werden.

Nach dem Claim werden Actor, aktive Superadmin-Rolle und `users.edit` erneut geprüft. Ebenso werden Zieluser, Profil, unveränderte alte Auth-/Profiladresse und beide Zielkonflikte erneut geladen. Erst danach ruft E3 die unveränderte UUID-stabile E2-Logik als internen Finalize-Schritt auf: Auth-first, Auth-Verifikation, Profilspiegelung, Profil-Verifikation und Kompensation bleiben erhalten. `completed` wird erst nach vollständigem Erfolg gesetzt und der Lock entsprechend dem DB-Constraint entfernt. Scheitert ausnahmsweise die Completion-Markierung, versucht der Service eine UUID-stabile Rücksynchronisierung auf die alte Adresse.

## Sicherheitsgrenzen und Restpunkte

Die öffentliche Seite zeigt weder E-Mail-Adressen, UUIDs, Actor, Rollen noch genaue interne Ablehnungsgründe. Die Bestätigung beweist Kontrolle über die neue Mailbox und verhindert Tippfehler, falsche Zieladressen sowie eine direkte Aktivierung durch die Admin-UI. Sie verhindert allein keinen Angriff, wenn sowohl ein Superadmin-Account kompromittiert ist als auch eine angreiferkontrollierte neue Mailbox verwendet wird. Die Warnmail an die alte Adresse verbessert die Erkennung.

Spätere optionale Härtungen bleiben Reauthentication des Superadmins, MFA, Freigabe über die alte Mailbox oder Security-Delay/Cancel-Window. Diese sind nicht Teil von E3.3. Ebenfalls offen bleibt der separate Livecheck, ob Supabase-Self-Service-/Secure-Email-Change-Einstellungen normale Benutzeränderungen außerhalb des Dashboardpfads erlauben. `/admin/profile` bleibt read-only für die offizielle Login-Adresse.

## Manueller Browser-/Mail-Test

Der kontrollierte E3.3-Test wurde am 28. August 2026 erfolgreich abgeschlossen. Die Warnmail erreichte die alte und die Bestätigungsmail die neue kontrollierte Testmailbox. Vor der Bestätigung blieb ausschließlich die alte Adresse loginfähig; die neue Adresse war noch nicht verwendbar. Das reine Öffnen des Links veränderte weder Auth noch Profil. Erst der bewusste Formular-POST über „E-Mail-Adresse bestätigen“ führte die Finalisierung aus. Danach war der alte Login gesperrt und der Login mit der neuen Adresse erfolgreich. Die Oberfläche übernahm die neue Adresse erst nach der Bestätigung. Primär- und Sekundärrollen, Permissions sowie die übrigen Benutzereinstellungen blieben unverändert. Der Versand verwendete lokal einen Absender der verifizierten Versanddomain; konkrete Testadressen und Environmentwerte werden nicht versioniert.

## Ausgeführter Testablauf

1. Mit einem Superadmin bei einem entbehrlichen Testuser eine neue kontrollierte Testadresse anfordern. Pending-Feedback prüfen; im Dialog und nach Refresh muss die alte aktive Adresse sichtbar bleiben.
2. Vor der Bestätigung Login mit alter Adresse erfolgreich und mit neuer Adresse erfolglos prüfen.
3. Alte Mailbox prüfen: Warnmail vorhanden, kein Bestätigungslink.
4. Neue Mailbox prüfen: Bestätigungsmail, Link und 15-Minuten-Hinweis vorhanden.
5. Link nur öffnen. Bestätigungsseite muss erscheinen; Auth-/Profiladresse dürfen sich noch nicht ändern.
6. Einmal auf „E-Mail-Adresse bestätigen“ klicken. Erfolgsmeldung sowie identische neue Auth-/Profiladresse prüfen.
7. Login prüfen: alte Adresse nicht mehr verwendbar, neue Adresse verwendbar.
8. UUID, Primär-/Sekundärrollen, Permissions, Nickname, Telefon, Avatar sowie Coach-/Board-Verknüpfungen auf Unverändertheit prüfen.
9. Abschlussmails prüfen: Sicherheitsinformation an alte und Erfolgsinformation an neue Adresse.
10. Den Link erneut öffnen beziehungsweise bestätigen. Keine zweite Mutation und keine zweite Finalisierung zulassen.
11. Ablauf separat nur mit einem entbehrlichen Testuser und ohne Produktionsdatenrisiko prüfen: abgelaufene Seite meldet Ablauf, Adresse bleibt alt; danach darf ein neuer Request den abgelaufenen Vorgang ersetzen.

Der Testablauf 1 bis 10 ist erfolgreich bestätigt. Der separate Self-Service-Sicherheitscheck außerhalb des E3-Workflows wird in B15.23E4 behandelt; bis zu dessen eindeutiger Livefreigabe bleibt B15.23E offen und uncommitted.
