# B15.23E4 – Auth-E-Mail-Self-Service-Sicherheitscheck

## Ergebnis der Repositoryanalyse

Die Anwendung bietet normalen Benutzern keinen UI-, Server-Action- oder API-Pfad zum Ändern ihrer offiziellen Login-E-Mail-Adresse. `/admin/profile` zeigt die Adresse read-only. Der eigene Profil-RPC akzeptiert ausschließlich Nickname und Telefon; Avataränderungen verwenden den abgegrenzten Media-Pfad. Der dortige Browser-Auth-Aufruf ändert ausschließlich das Passwort. Der Benutzereditor startet eine E-Mail-Änderung nur nach Session-, Aktivitäts-, `users.edit`- und Superadmin-Prüfung über den E3-Pending-/Confirmation-Workflow. Die UUID-stabile E2-Finalisierung bleibt server-only und verwendet `auth.admin.updateUserById()`.

Die Repositorygrenze genügt jedoch nicht für den vereinbarten Produktvertrag. Ein angemeldeter Benutzer besitzt unabhängig von unserer UI einen Supabase-Auth-Access-Token und kann den öffentlichen Auth-Endpunkt grundsätzlich über `supabase.auth.updateUser({ email: ... })` ansprechen. Supabase dokumentiert diesen Self-Service-Aufruf ausdrücklich. „Secure Email Change“ verlangt je nach Einstellung Bestätigungen an alte und neue Adresse, verhindert aber nicht, dass der Benutzer den unabhängigen Vorgang selbst startet.

Die aktuell offiziell dokumentierten Auth Hooks umfassen unter anderem Before User Created, Custom Access Token, Send Email sowie MFA- und Password-Verification-Hooks. Ein allgemeiner Before-User-Updated-Hook, mit dem ausschließlich Self-Service-E-Mail-Änderungen abgelehnt und Admin-API-Updates zugelassen werden könnten, ist dort nicht verfügbar. Der Send-Email-Hook ist keine gleichwertige Autorisierungsgrenze und würde außerdem den gesamten Auth-Mailtransport betreffen. Eine nicht dokumentierte Mutation des `auth`-Schemas oder eigener Trigger auf `auth.users` wird nicht eingeführt.

## Sicherheitsklassifikation

Der anschließend kontrolliert ausgeführte Live-Negativtest hat die Repositoryunsicherheit aufgelöst: Eine normale Nicht-Superadmin-Testidentität konnte `PUT /auth/v1/user` mit einer neuen Adresse erfolgreich aufrufen. Supabase antwortete mit HTTP 200 und setzte `new_email`, während `email` noch unverändert blieb. Der Link wurde nicht bestätigt. Der Livezustand ist damit **B – Self-Service mit Bestätigung** und für den Produktvertrag eine **CONFIRMED SECURITY GAP**, nicht mehr Klassifikation D.

Deshalb ist das B15.23E-Commit-Gate nicht erfüllt. Es wurde keine Auth-Konfiguration angepasst und kein SQL durch Codex ausgeführt. Der manuelle E5.2-Preflight ist ausgewertet; vor einem Guard-Proposal fehlen noch sanitisierten Mutationsformnachweise für Admin-Forward und Kompensation: [`b15-23e5-auth-email-self-service-hardening-live-preflight-analysis.md`](b15-23e5-auth-email-self-service-hardening-live-preflight-analysis.md).

## Ausgeführter manueller Live-Test

1. Eine entbehrliche aktive Testidentität ohne Superadmin-Rolle verwenden; keine produktive Identität und keine bestehende Superadmin-Adresse verwenden.
2. Mit der bisherigen Testadresse anmelden und verifizieren, dass `/admin/users` beziehungsweise der E3-Request-Pfad nicht verfügbar ist.
3. In einem lokalen, nicht versionierten Browserkonsolen-Test denselben normalen Supabase-Browserclient und die bestehende Session verwenden.
4. Einmal `supabase.auth.updateUser({ email: "self-service-target@example.test" })` mit einer kontrollierten, entbehrlichen Zielmailbox ausführen. Im tatsächlichen Test muss anstelle der synthetischen Dokumentationsadresse eine kontrollierte Testadresse eingesetzt werden; sie darf nicht in Logs oder Dateien übernommen werden.
5. Nur Status und sanitisierten Fehlercode notieren. Keine Access-Tokens, Sessiondaten oder vollständigen Adressen ausgeben.
6. Prüfen, ob der Request sofort abgelehnt wird oder ob Supabase eine beziehungsweise zwei Bestätigungsmails erzeugt.
7. Authzustand und Login vor jeglicher Bestätigung prüfen. Wenn bereits ein Email-Change-Pending-Zustand angelegt oder eine Auth-Mail erzeugt wurde, ist der Self-Service nicht vollständig blockiert.
8. Den Vorgang nur mit der entbehrlichen Testidentität kontrolliert abschließen beziehungsweise über das Dashboard bereinigen. Keine produktive Identität verändern.

Das erwartete Fall-A-Ergebnis trat nicht ein. Der Request wurde angenommen und ein Pending-Zustand erzeugt. Der Test belegt die Security Gap; Token und Testadresse werden nicht dokumentiert.

## Möglicher Folgeblock bei negativem Test

Falls der Self-Service angenommen wird, wird vor jeder Liveänderung ein eigener Auth-Hardening-Block benötigt. Dieser muss die tatsächlich verfügbaren Supabase-Projektoptionen erneut gegen den Liveplan prüfen und nachweisen, dass nur Self-Service-E-Mailänderungen gesperrt werden, während Invite, Recovery, Passwortwechsel und E3 `auth.admin.updateUserById()` funktionieren. Gibt es keine unterstützte selektive Projekteinstellung oder Hook-Grenze, ist eine Produktentscheidung beziehungsweise eine vorgelagerte kontrollierte Auth-Gateway-Lösung erforderlich. Es wird in E4 keine undokumentierte Auth-Schema- oder Triggerlösung vorgeschlagen.

## Unveränderte Follow-ups

Das zentrale Corporate-Design-Mailtemplate, MFA/Reauthentication, optionale Old-Mail-Freigabe, Security Delay/Cancel Window sowie Retention/Cleanup terminaler `admin_email_change_requests` bleiben getrennte spätere Blöcke. E3-Pending-Request, 15-Minuten-TTL, Token-Hash, read-only GET, bewusster POST, Claim-/Replay-Schutz, Requester-Revalidierung, E2-Finalisierung, Auth-first, Profilspiegelung, Kompensation und Abschlussmails bleiben unverändert.
