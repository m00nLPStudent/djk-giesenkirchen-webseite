# B15.23E5.2.1 – Auth-E-Mail-Mutationsformen verifizieren

## Zweck und Grenzen

Dieser Block bereitet ausschließlich den sanitisierten Nachweis der von GoTrue ausgeführten Mutationsformen vor. Es wurde keine Live-Mutation, kein SQL und kein Guard ausgeführt. Echte Adressen, UUIDs, Sessions und Tokenwerte dürfen weder in Exporte noch in Git gelangen. B15.23E bleibt offen.

## Aus dem Produktcode bewiesene Zustände

Der Bestätigungs-POST claimt einen gültigen `pending`-Request atomar als `confirming` und setzt `confirmed_at` und `locked_at`. Erst danach ruft er den E2-Finalizer auf. Dieser ändert Auth von normalisiertem `old_email` auf `new_email`, verifiziert Auth, spiegelt und verifiziert `admin_profiles.email`. Erst wenn dieser gesamte Schritt erfolgreich ist, markiert E3 den Request als `completed`.

| Phase | Requeststatus | Auth-/Profilzustand |
|---|---|---|
| Start | `pending` | unverändert |
| Claim | `confirming` | unverändert; TTL beim Claim geprüft |
| Auth Forward | `confirming` | `old_email` → `new_email` |
| Auth Verify / Profile Mirror / Verify | `confirming` | Zielzustand wird geprüft |
| Fehler vor erfolgreichem Auth-Update | anschließend `failed` | kein Reverse erforderlich |
| Fehler nach Auth-Update | `confirming` während Reverse | Auth `new_email` → `old_email` |
| Reverse erfolgreich | anschließend `failed` | Auth wieder alt |
| Reverse fehlgeschlagen | anschließend `failed` | manueller Review erforderlich |
| Finaler Erfolg | `completed` | Auth und Profil auf neuer Adresse |

`old_email` und `new_email` bleiben während Claim, Forward und normaler Kompensation Bestandteil derselben Requestzeile. Damit sind der normale Forward-Vertrag (`OLD.email=request.old_email`, `NEW.email=request.new_email`) und der normale Reverse-Vertrag (`OLD.email=request.new_email`, `NEW.email=request.old_email`) bei `status=confirming` im Code eindeutig.

## Completion-Markierungs-Ambiguität

`completeRequest` führt `confirming → completed` aus und verlangt anschließend eine zurückgelesene Zeile. Liefert diese Operation für den Core kein verifiziertes Erfolgsergebnis, fordert der Core vorsorglich den E2-Finalizer zurück auf `old_email` an und versucht danach, den Request als fehlgeschlagen zu markieren.

Bei einem eindeutigen Updatefehler bleibt der Request `confirming`; Reverse und `failed` entsprechen dem normalen Vertrag. Bei einem mehrdeutigen Transport-/Read-after-write-Fehler kann die Datenbankänderung jedoch bereits `completed` committed sein, während der Core `ok=false` erhält. Dann kann Reverse unter `completed` angefordert werden; `failRequest` ändert eine bereits abgeschlossene Zeile nicht mehr. Der Test-Harness beweist diese mögliche Zustandsfolge. Die Codewirkung ist damit geklärt, aber ein sicherer enger Guard-Vertrag für diese Ausnahme noch nicht entworfen. Ein pauschales Allow für beliebige `completed`-Requests wäre zu weit.

## Noch live zu beweisende Mutationsformen

Der Code beweist Richtung und Workflowstatus, nicht die genaue Spaltenmenge, die GoTrue in `auth.users` schreibt. Der manuelle Test muss für Self-Service-Start und Admin-Forward ausschließlich aktive/pending E-Mail-Präsenz und erwartete Übereinstimmung, beide Email-Change-Token-Präsenzen, `email_change_confirm_status`, relevante Versand-/Bestätigungszeit-Präsenzen, `email_confirmed_at`, `updated_at` sowie Recovery-/Reauthentication-Präsenzen vergleichen. Token- und E-Mail-Werte werden nie ausgegeben.

## Read-only Helper

[`../sql/b15-23e5-auth-email-mutation-diff-readonly.sql`](../sql/b15-23e5-auth-email-mutation-diff-readonly.sql) enthält versioniert ausschließlich `NULL`-Platzhalter. Nur in einer lokalen SQL-Editor-Kopie werden Testuser-UUID sowie erwartete alte und neue Testadresse eingesetzt. Der Output enthält keine Identität, Adresse oder Tokenwerte. Zusätzlich zeigt er ausschließlich aggregierte E3-Statuszahlen und ob ein `confirming`-Request innerhalb seiner TTL vorhanden ist.

## Manueller Self-Service-Test

1. Ausschließlich den entbehrlichen Nicht-Superadmin-Testuser wählen.
2. Einen vorhandenen nativen Pending-Zustand nach gesonderter Prüfung mit dem separaten Cleanup-Proposal bereinigen und dessen Read-only Postcheck exportieren.
3. Den Helper als `self-service-before` ausführen und den sanitisierten Output lokal exportieren.
4. Als Testuser genau einen nativen Self-Service-E-Mailwechsel starten.
5. Keine Auth-Mail und keinen Bestätigungslink öffnen.
6. Den Helper unverändert als `self-service-after` ausführen und exportieren; danach stoppen.

## Manueller Admin-Forward-Test

1. Den nativen Pending-Zustand vor diesem Test wieder kontrolliert bereinigen und read-only bestätigen.
2. Über die bestehende Benutzerverwaltung für denselben Testuser einen E3-Wechsel anfordern.
3. Den Helper unmittelbar vor dem bewussten Bestätigungs-POST als `admin-forward-before` exportieren; der aktive E3-Request muss `pending` sein.
4. Die vorhandene E3-Bestätigungsseite genau einmal absenden.
5. Den Helper als `admin-forward-after` exportieren; die E3-Zeile soll terminal `completed` sein.

Der sehr kurze Zustand `confirming` muss nicht durch einen riskanten Live-Halt erzwungen werden. Claim-Reihenfolge und Forward-/Reverse-Status sind durch Servicecode und Tests belegt.

## Reverse-/Compensation-Nachweis

Ein Livefehler wird nicht provoziert. Der E2-Test beweist die exakten Admin-API-Aufrufe `old → new` und danach `new → old`. Der E3-Harness beweist, dass beide im Normalfall unter `confirming` stattfinden und erst danach `failed` gesetzt wird; fehlgeschlagene Kompensation bleibt `failed` mit manuellem Review. Ein weiterer Livetest ist derzeit nicht gerechtfertigt.

## Cleanup

Der alte native Pending-Testzustand muss vor einem sauberen Before/After-Test entfernt werden. Das separate [Cleanup-Proposal](../sql/b15-23e5-pending-self-service-email-cleanup-proposal.sql) ist auf genau eine lokal eingesetzte Test-UUID begrenzt, stoppt bei einem aktiven E3-Request und rollt zurück, wenn nicht exakt eine Pending-Zeile getroffen wird. Es greift direkt in das verwaltete Authschema ein und darf deshalb nur nach ausdrücklicher manueller Freigabe ausgeführt werden. Der [Postcheck](../sql/b15-23e5-pending-self-service-email-cleanup-postcheck-readonly.sql) gibt nur Präsenz-/Statuswerte aus.

## Entscheidung

Die manuell übermittelten sanitisierten Resultsets beweisen inzwischen beide GoTrue-Mutationsformen. Beim Self-Service bleibt die aktive Adresse alt; `email_change`, beide Email-Change-Tokenfelder und `email_change_sent_at` wechseln von leer auf vorhanden, ohne E3-Request. Beim E3-Admin-Forward wechselt ausschließlich die aktive Adresse von erwartet alt auf erwartet neu; die nativen Pending-Felder bleiben leer und der historische `completed`-Zähler steigt um eins.

Forward- und normaler Reverse-Contract sind damit live beziehungsweise code-/testseitig belegt. Die Completion-Ambiguität verhindert dennoch einen unmittelbaren Produktionsguard: Ein bloßes kurzes `completed`-Zeitfenster wäre keine eindeutige Autorisierung. Bevorzugt wird die in [`b15-23e5-auth-email-compensation-state-design.md`](b15-23e5-auth-email-compensation-state-design.md) beschriebene kleine State-Machine-Erweiterung mit explizitem `compensating`-Claim. Klassifizierung: **B – kleine kontrollierte Vorarbeit nötig**. Guard, Trigger und Produktions-Hardening-Proposal wurden nicht erstellt.
