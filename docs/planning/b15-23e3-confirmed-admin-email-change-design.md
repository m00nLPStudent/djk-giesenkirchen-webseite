# B15.23E3 – Bestätigter Admin-E-Mail-Wechsel

## Status und Blockgrenze

B15.23E2 wurde im Browser erfolgreich verifiziert: Die direkte UUID-stabile Auth-/Profil-Synchronisierung, Rollen-/Personenlink-Stabilität und Kompensation funktionieren. Der Produktivvertrag wird mit E3 jedoch bewusst verschärft. Eine vom Superadmin beantragte neue Adresse darf erst nach Besitznachweis der neuen Mailbox aktiv werden.

E3.1 bereitete ausschließlich Schemaanalyse, read-only Preflight und ein noch nicht ausgeführtes Proposal vor. Der manuelle Live-Preflight wurde am 28. August 2026 ausgeführt und in E3.1.1 anhand von 14 CSV-Resultsets ausgewertet. Die E2-Synchronisierung bleibt unverändert und wird später die interne Finalize-Funktion. Request-/Confirmation-Code, öffentliche Route und E3-Mailversand werden erst nach manueller Migration und Postcheck implementiert.

## Zustands- und Sicherheitsmodell

Vorgeschlagen ist die server-only Tabelle `public.admin_email_change_requests` mit:

- stabiler Request-, Zielbenutzer- und Actor-UUID;
- normalisierter alter und neuer Adresse;
- ausschließlich SHA-256-Hash eines kryptografisch zufälligen Tokens;
- `status` mit `pending`, `confirming`, `completed`, `cancelled`, `expired`, `failed`;
- Ablauf-, Bestätigungs-, Abbruch-, Abschluss-, Lock- und Auditzeitpunkten;
- kurzem sanitisierten `failure_code`, niemals Providertext;
- partiellem Unique-Index für genau einen `pending`/`confirming` Request je Benutzer;
- Unique-Index auf `token_hash` und Ablaufindex für Pending-Requests.

Der Klartexttoken wird später mit Node `crypto.randomBytes` erzeugt, nur in den Bestätigungslink eingesetzt und nie persistiert oder geloggt. Der gespeicherte SHA-256-Hash erlaubt serverseitigen Vergleich. Die zentrale TTL wird im späteren Produktcode einmalig als `EMAIL_CHANGE_CONFIRMATION_TTL_MINUTES = 15` definiert. Fünf Minuten waren der ursprüngliche Richtwert; 15 Minuten sind für reale Zustellung robuster und bleiben kurzlebig.

Der öffentliche Bestätigungsendpoint benötigt keine Session. Er lädt ausschließlich serverseitig über Token-Hash, prüft Zustand, Ablauf, Ziel-UUID, unveränderte alte Auth-/Profiladresse und erneut beide Zielkonflikte. Ein bedingtes Service-Role-Update von `pending` nach `confirming` einschließlich `confirmed_at` und `locked_at` ist der atomare Claim. Bei zwei parallelen Klicks erhält nur ein Aufruf eine Zeile; Replay, ersetzte, abgebrochene, abgelaufene und abgeschlossene Requests bleiben neutral ungültig.

`confirmed_at` bezeichnet den erfolgreichen atomaren Token-Claim; `completed_at` erst die erfolgreiche Auth-/Profilsynchronisierung. `expired_at` hält die explizite Terminalisierung eines abgelaufenen Requests fest. Ein `failed`-Request benötigt einen kurzen sanitisierten `failure_code`. Vor dem Erstellen eines neuen Requests terminalisiert die spätere Anwendung einen abgelaufenen `pending`-Request als `expired`, weil der race-sichere partielle Unique-Index bewusst alle Zeilen mit `pending` oder `confirming` umfasst.

Erst nach dem Claim ruft der Endpoint die vorhandene E2-Synchronisierung auf. Erfolg setzt `completed`; E2-Fehler beziehungsweise Kompensation führen zu `failed` oder `cancelled`, nie zu einem falschen Abschluss. Rollen, Permissions, Coach-/Board-Links und sonstige Profilfelder bleiben außerhalb beider Phasen.

## Request- und Mailvertrag

Die spätere Request-Phase prüft erneut Session, aktiven Superadmin, `users.edit`, Ziel-UUID, Ausgangskonsistenz und Konflikte. Sie invalidiert bestehende offene Requests, erzeugt Token/Hash und speichert den neuen Pending-Request. Auth und Profil bleiben dabei unverändert; die alte Adresse bleibt alleinige Login-Adresse.

Vier einfache technische Übergangsmails sind vorgesehen:

1. Bestätigungslink ausschließlich an die neue Adresse;
2. Sicherheitsinformation ohne Token an die alte Adresse;
3. Abschlussinformation an die neue Adresse erst nach erfolgreichem Finalize;
4. Abschluss-/Sicherheitsinformation an die alte Adresse erst nach erfolgreichem Finalize.

Die bestehende zentrale Mailabstraktion wird wiederverwendet und in Tests gestubbt. Scheitert die kritische Bestätigungsmail, wird der Request invalidiert und nicht als erfolgreich angezeigt. Scheitert nur die Vorabwarnung an die alte Adresse, darf der Request nach sanitisiertem Logging bestehen bleiben. Kein echter Provider-Versand gehört in automatisierte Tests.

Diese Mails sind ausdrücklich keine finalen Vereinsvorlagen. Der vorhandene spätere Roadmap-Punkt „Professionelles Vereins-E-Mail-Template / Corporate Design“ bleibt bestehen und muss zusätzlich Auth-, Notification- und E-Mail-Change-Mails auf Logo, rot/weiß/schwarzes responsives Layout, einheitliche Buttons, Header/Footer sowie erforderliche Kontakt-/Datenschutz-/Impressumsangaben migrieren.

## RLS, Grants und Audit

Das Proposal aktiviert RLS innerhalb derselben Transaktion, erzeugt keine Browserpolicy, entzieht `PUBLIC`, `anon` und `authenticated` sämtliche Tabellenrechte und gewährt nur `service_role` die benötigten CRUD-Rechte. Token-Hash und Pending-Adressen werden nie an Clients ausgeliefert. Superadmins operieren ausschließlich über autorisierte Server Actions; der öffentliche Endpoint verwendet ebenfalls nur den serverseitigen Service-Pfad.

`notification_audit` ist ein spezialisiertes Notification-Monitoring-Audit und nicht ohne Liveprüfung als allgemeines Security-Audit geeignet. E3.1 baut es daher nicht künstlich um. Die Ereignisse `email_change_requested`, `email_change_completed` und `email_change_failed` bleiben als späterer, datensparsamer Auditpunkt vorgemerkt; erlaubt wären nur Benutzer-/Actor-ID, Eventtyp und Zeitpunkt, niemals Token oder Rohadressen.

## Live-Schemaentscheidung E3.1.1

Der Live-Preflight bestätigte, dass weder die Zieltabelle noch eine gleichnamige Relation existiert und der geschätzte Ausgangsbestand null ist. `admin_profiles.id` ist die nicht-nullbare UUID und verweist mit `ON DELETE CASCADE` auf `auth.users(id)`. Deshalb verweist `user_id` auf `public.admin_profiles(id) ON DELETE CASCADE`: Wird der Zielaccount gelöscht, ist ein offener Wechsel gegenstandslos und wird mitgelöscht. `requested_by` bleibt dagegen eine nicht-nullbare stabile UUID ohne FK. Dieses bereits bei `notification_audit.actor_user_id` erkennbare Muster erhält die technische Actor-Referenz auch dann, wenn das anfordernde Profil später gelöscht wird; es verhindert zugleich einen unerwünschten Cascade und benötigt weder Nullsetzung noch E-Mail-Bezug.

Die Live-Datenbank verwendet `public.set_updated_at()` als generischen normalen Triggerhelfer bei zahlreichen Tabellen, darunter `notification_deliveries`; E3 verwendet genau diese Funktion weiter. Das server-only Vorbild `notification_deliveries` besitzt RLS, keine Clientpolicy und ausschließlich explizite `service_role`-Tabellenrechte. Das E3-Proposal folgt diesem Modell: RLS innerhalb derselben Transaktion, keinerlei Policy, vollständiger Entzug von `PUBLIC`, `anon` und `authenticated`, explizites CRUD nur für `service_role`, keine Sequence und keine neue Funktion beziehungsweise RPC.

Gespeichert werden ausschließlich Ziel-/Actor-UUID, alte und neue normalisierte Adresse, SHA-256-Token-Hash sowie Status- und Zeitdaten. Namen, Rollen, Telefon, IP-Adresse, User-Agent, Klartexttoken und Providertexte bleiben ausgeschlossen. Die Request-Tabelle selbst liefert für E3 ausreichende Zustandsnachvollziehbarkeit; `notification_audit` wird nicht zweckentfremdet. Eine automatische Retention oder ein Cleanup-Cron wird in E3 nicht eingeführt. Eine spätere betriebliche Aufbewahrungsfrist für terminale Requests ist vor Go-live gesondert festzulegen.

## SQL-Artefakte und nächster Schritt

- [`../sql/b15-23e3-admin-email-change-request-preflight-readonly.sql`](../sql/b15-23e3-admin-email-change-request-preflight-readonly.sql)
- [`../sql/b15-23e3-admin-email-change-request-proposal.sql`](../sql/b15-23e3-admin-email-change-request-proposal.sql)
- [`../sql/b15-23e3-admin-email-change-request-postcheck-readonly.sql`](../sql/b15-23e3-admin-email-change-request-postcheck-readonly.sql)
- [`b15-23e3-admin-email-change-live-preflight-analysis.md`](b15-23e3-admin-email-change-live-preflight-analysis.md)

Klassifizierung nach Preflight: **B – Proposal korrigiert und freigabefähig**. Die manuelle Ausführung und der E3.2-Postcheck bestätigten anschließend Schema, RLS, null Policies, blockierte Browserrollen, Token-/Status-/Race-Vertrag, Trigger und null Ausgangszeilen. Die durch Default Privileges verbliebenen `service_role`-Rechte REFERENCES, TRIGGER und TRUNCATE wurden anschließend mit dem minimalen Grant-Fix manuell entzogen und per Mini-Postcheck verifiziert. Der finale DB-Vertrag ist damit **A – vollständig korrekt**. E3.3 implementiert Request, technische Übergangsmails, GET-ohne-Mutation, bewussten POST-Claim und die interne E2-Finalisierung: [`b15-23e3-confirmed-admin-email-change-implementation.md`](b15-23e3-confirmed-admin-email-change-implementation.md).

## E5-Sicherheitsgrenze

Der E3-Vertrag selbst wurde vollständig manuell bestätigt. Ein anschließender direkter Live-Test belegte jedoch, dass eine normale angemeldete Nicht-Superadmin-Testidentität unabhängig von E3 über Supabase Auth einen Self-Service-E-Mailwechsel starten und `new_email` setzen kann. Secure Email Change verhindert diese Initiierung nicht. B15.23E bleibt deshalb bis zur providerseitigen Sperre dieses nativen Pfads offen. Analyse und Read-only-Preflight: [`b15-23e5-auth-email-self-service-hardening-analysis.md`](b15-23e5-auth-email-self-service-hardening-analysis.md).

Der E5.2-Live-Preflight bestätigte einen grundsätzlich möglichen Triggerguard, aber keine sichere Rollenunterscheidung: Self-Service und Admin API mutieren über `supabase_auth_admin`. Ein späterer Guard muss Mutationsform, stabile UUID und den passenden E3-Request kombinieren und sowohl normale Kompensation im Status `confirming` als auch den seltenen Completion-Ambiguitätsfall erhalten. Vor einem Proposal sind deshalb weitere sanitisierten Spaltendiffs erforderlich.
