# B15.21A – Membership-Submit-Vertrag und Security-Härtung

## Vorherige Schwachstellen

Die öffentliche Server Action reichte das vollständige Browserobjekt an `.insert()` weiter. Dadurch waren `year_group` und interne Workflowfelder technisch manipulierbar. Pflichtfelder und Consent wurden nur im Client geprüft. Der Live-Preflight bestätigte deaktiviertes RLS, eine permissive Public-INSERT-Policy sowie umfassende Tabellen- und Spaltenrechte für `anon` und `authenticated`. Damit waren nicht nur INSERT, sondern effektiv auch Lesen, Ändern, Löschen und TRUNCATE möglich.

## Umgesetzter Vertrag

Der zentrale serverseitige Core übernimmt ausschließlich Vorname, Nachname, Telefon, E-Mail, Geburtsdatum, Anfrageart, gewünschte Mannschaft, Nachricht und Consent. Text wird getrimmt, E-Mail normalisiert, Feldlängen und Formate werden begrenzt. `request_type` ist auf die vier bestehenden DB-Werte allowlisted. `year_group` entsteht ausschließlich aus dem validierten ISO-Geburtsdatum. Status-, Zeitstempel-, Weiterleitungs- und Notizfelder werden nie kopiert.

Eine Mannschaft wird nur für `aktives-mitglied-fussball` akzeptiert. UUID, Existenz und Aktivität werden serverseitig geprüft. Ist eine Department-Zuordnung vorhanden, muss sie aktiv sein und den Slug `fussball` tragen; bei den im Bestand zulässigen `NULL`-Zuordnungen wird keine fachlich unbelegte Abteilung angenommen. Für alle anderen Anfragearten wird die Mannschaft auf `null` gesetzt. Eine Geburtsjahr-/Team-Eligibility ist ausdrücklich noch nicht Bestandteil dieses Blocks.

Der Browser sendet den tatsächlichen Consent als Boolean; Zeitpunkt und Policy-Version `2026-08-26` setzt ausschließlich der Server. Ein verborgenes, nicht fokussierbares `website`-Feld dient als Honeypot. Persistentes Rate Limiting ist ohne gemeinsame DB-/externe Infrastruktur nicht zuverlässig und bleibt eine gesonderte Entscheidung.

## Manueller Datenbankschritt

Die drei Consent-Spalten fehlen im bestätigten Live-Schema. Das finale Proposal ergänzt sie samt Konsistenz-Constraint, entfernt alle vier historischen `app_metadata.role = admin`-Policies, aktiviert RLS ohne FORCE und entzieht `PUBLIC`, `anon` sowie `authenticated` sämtliche Tabellen- und expliziten Spaltenrechte. Es werden bewusst keine Browserpolicies angelegt. `service_role` behält alle Tabellenrechte und umgeht RLS wie vorgesehen.

Membership-Übersicht, Dashboard-Zähler, Weiterleitung, datensatzgebundene Bearbeitung und öffentlicher Submit verwenden nach ihrer jeweiligen serverseitigen Permission-/Scope-Prüfung den server-only Service-Role-Client. Die historischen JWT-App-Metadata-Policies sind damit keine fachliche Sicherheitsgrenze mehr.

Preflight und Postcheck erzeugen zusätzlich Anzahl und Fingerprint der fachlichen Bestandsfelder. Die fünf vorhandenen Zeilen müssen nach dem Proposal denselben Fingerprint besitzen. Die neuen Consent-Felder stehen für diese Bestandszeilen auf `false` beziehungsweise `NULL`; es wird kein historischer Consent erfunden.

Reihenfolge:

1. `b15-21a-membership-submit-hardening-preflight-readonly.sql`
2. `b15-21a-membership-submit-hardening-proposal.sql`
3. `b15-21a-membership-submit-hardening-postcheck-readonly.sql`

Bis dieser Schritt bestätigt ist, ist B15.21A nicht produktiv abgeschlossen. Der Rollback stellt den bestätigten unsicheren Live-Zugriff bewusst nur für einen echten Notfall wieder her, bewahrt aber Consent-Spalten und vorhandene Nachweise, um keinen Datenverlust auszulösen.
