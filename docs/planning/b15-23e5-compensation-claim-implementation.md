# B15.23E5.2.5 – Compensation Claim Implementation

## Livegrundlage

Die Compensation-State-Migration und ihr vollständiger Read-only Postcheck sind manuell **PASS**. `compensation_started_at`, der Status `compensating`, der erweiterte aktive Unique-Index, RLS, server-only Grants und vier unveränderte valide Bestandszeilen sind live bestätigt. Codex hat in diesem Block kein SQL ausgeführt.

## Zentraler Ablauf

E2 führt nur noch den Forward `EXPECTED_OLD → EXPECTED_NEW` aus. Wenn Auth-Verifikation, Profilspiegelung oder abschließende Verifikation nach dem Forward fehlschlagen, meldet E2 `requiresCompensation`; ein direkter Reverse existiert dort nicht mehr.

E3 verarbeitet Compensation zentral:

1. Atomarer bedingter Claim der konkreten Requestzeile aus `confirming`, im Completion-Ambiguitätsfall alternativ aus `completed`.
2. Bindung an Request-ID, stabile Benutzer-UUID, normalisierte alte/neue Adresse, `confirmed_at` und den exakten Workflow-Zeitstempel.
3. `completed` darf nur passen, wenn `completed_at` exakt demselben Workflow-Zeitstempel entspricht. Es gibt kein Zeitfenster.
4. Der Claim setzt `status=compensating` und `compensation_started_at`. `locked_at` bleibt beim Confirming-Pfad erhalten; beim Completed-Pfad wird es auf den Claimzeitpunkt gesetzt.
5. Ein separates Read-after-write prüft ID, UUID, beide Adressen, Status, Zeitwerte und Lock.
6. Erst danach prüft der Reverse-Service, dass Auth aktuell `EXPECTED_NEW` enthält, ändert per stabiler UUID auf `EXPECTED_OLD` und liest Auth erneut zur Verifikation.
7. Der Request wird exakt einmal `compensating → failed` terminalisiert. Dabei werden `completed_at` und `locked_at` geleert; `compensation_started_at` bleibt erhalten.

## Fehlercodes

- `email_sync_failed_compensated`: Reverse nach einem E2-Auth-/Profilfehler erfolgreich und verifiziert.
- `completion_state_failed_compensated`: Reverse nach Completion-Markierungsambiguität erfolgreich und verifiziert.
- `compensation_failed`: Reverse oder dessen Verifikation fehlgeschlagen.

Freie Providerfehler werden nicht gespeichert. Claim-/Terminalisierungsprobleme erzeugen ausschließlich sanitisierte Stage-Codes im Serverlog und erfordern manuelle Prüfung.

## Race- und Idempotenzschutz

Der Claim ist ein einzelnes `UPDATE ... WHERE ... RETURNING`. Es gibt kein vorheriges SELECT mit anschließend ungeschütztem UPDATE. Nur `confirming` und – ausschließlich im Ambiguitätskontext – exakt passendes `completed` werden versucht. `pending`, `cancelled`, `expired`, `failed` und bereits `compensating` treffen keine Zeile. Bei einem mehrdeutigen Updatefehler wird nicht anhand eines bloßen Statusreads Besitz am Claim angenommen; der Ablauf bleibt fail-closed. Parallele Aufrufe können deshalb nur einen Reverse auslösen.

## Unveränderte Verträge

Der Erfolgsweg bleibt `pending → confirming → completed`; `compensation_started_at` bleibt dabei null. Fehler vor einem erfolgreichen Auth-Forward claimen und reversen nicht. Completion-Mailfehler lösen keine Compensation aus. Stable UUID, Requester-Revalidierung, Konfliktprüfungen, Profilspiegelung, Rollen und Permissions bleiben unverändert.

## Sicherheit und Abschlussstatus

Alle bekannten produktiven Reverse-Aufrufe laufen hinter dem Claim. Der native Self-Service-Bypass wird durch den inzwischen live verifizierten `auth.users`-Guard blockiert.

E5.3 hat den erforderlichen Guard-Live-Preflight vorbereitet. Der Claim-Vertrag bleibt unverändert; Proposal und Aktivierung des Guards warten auf die manuelle Preflight-Auswertung.

E5.3.1 hat den Live-Preflight als PASS ausgewertet. Der Guard-Entwurf erlaubt den Reverse ausschließlich bei genau einem passenden `compensating`-Request und bleibt damit kompatibel zum zentralen Claim. Das Guard-Proposal ist vorbereitet, aber nicht live.

Der Guard ist inzwischen live; Self-Service-Block und der legitime E3-Forward sind bestätigt. Der zusätzliche künstliche Compensation-Livetest wird bewusst nicht ausgeführt: **NOT LIVE EXECUTED – COVERED BY AUTOMATED TESTS**. Der seltene Fehlerpfad ist durch Claim-, Race-, Reverse-, Guard- und E3-Regressionstests abgedeckt; der fehlende Failure-Injection-Livetest ist kein Blocker für den technischen Abschluss von B15.23E.
