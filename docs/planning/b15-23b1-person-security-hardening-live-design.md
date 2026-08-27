# B15.23B1 – Legacy Person Tables Security Hardening

## Abschlussstatus

B15.23B1 ist live umgesetzt. Das Proposal wurde vom Benutzer manuell erfolgreich ausgeführt; der Read-only-Postcheck und der anschließende Browsertest waren erfolgreich. Codex hat im Abschlusslauf kein SQL ausgeführt und keine Datenbankdaten verändert. Die Datenbank enthält weiterhin ausschließlich Testdaten/Testpersonen; B15.23B1 umfasste weder Echtdatenmigration noch Personenbereinigung.

Der bestätigte Zielzustand:

- RLS ist für `coaches`, `board_members` und `club_contacts` aktiv; FORCE RLS bleibt jeweils deaktiviert.
- anon hat nur die fachlich erforderliche öffentliche Lesbarkeit und keinerlei INSERT-, UPDATE-, DELETE-, TRUNCATE-, REFERENCES- oder TRIGGER-Rechte.
- authenticated hat für Coaches SELECT/INSERT/UPDATE/DELETE, für Board SELECT/INSERT/UPDATE und für Clubkontakte SELECT/INSERT/UPDATE/DELETE; Mutationen werden zusätzlich durch die neuen operationsbezogenen Permission-Policies begrenzt. TRUNCATE, REFERENCES und TRIGGER sind entzogen.
- service_role behält die erforderlichen Vollrechte.
- Offene PUBLIC-Write-Policies, historische `true`-Write-Policies und die alten `app_metadata.role = admin`-Policies sind entfernt.
- `remove_entity(text,uuid)` und `synchronize_media_assignment(text,uuid,uuid,text)` bleiben für anon/authenticated nicht ausführbar und ausschließlich für service_role ausführbar.

## Ursprünglich bestätigter Live-Befund

Der manuell ausgeführte B15.23B-Preflight hat die zuvor vermutete Sicherheitslücke live bestätigt. `coaches` und `board_members` haben RLS aktiviert, besitzen aber uneingeschränkte PUBLIC-Write-Policies. `club_contacts` hat RLS deaktiviert; seine historischen `app_metadata.role = admin`-Policies schützen daher nicht. `anon` und `authenticated` besitzen auf allen drei Tabellen effektiv SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES und TRIGGER sowie weitreichende Spaltenrechte.

`remove_entity(text,uuid)` und `synchronize_media_assignment(text,uuid,uuid,text)` sind dagegen bereits korrekt gehärtet: kein EXECUTE für PUBLIC, anon oder authenticated, EXECUTE für service_role. Dieser Vertrag bleibt unverändert.

## Anwendungspfade und benötigte Zielrechte

| Entität | Pfad | Permission/Scope | Datenbankakteur | Zielrecht |
|---|---|---|---|---|
| Trainer Create | `saveCoachWithScopeAction` → `saveCoach` → `coachWrite.repository` | `coaches.create`, danach Person-/Team-Scope | authenticated SSR | INSERT; der bestehende kompensierende Create-Rollback benötigt bei einem nachgelagerten Fehler zusätzlich die bereits heute an Verwaltungsrollen vergebene Permission `coaches.delete` |
| Trainer Edit | gleicher Pfad | `coaches.edit`, konkrete Coach-/Team-Scope-Prüfung | authenticated SSR | UPDATE |
| Trainer Archivierung | `removeCoachWithScopeAction` → `archiveCoach` | `coaches.delete`, konkrete Coach-/Team-Scope-Prüfung | authenticated SSR | UPDATE auf Coach; saisonale Tabellen bleiben außerhalb dieses Proposals |
| Vorstand Create/Edit | `saveBoardMemberWithScopeAction` → `saveBoardMember` | `settings.edit`, Person-Scope | authenticated SSR | INSERT/UPDATE |
| Vorstand Delete | `removeBoardMemberWithScopeAction` | `settings.edit`, Delete-Scope | service_role | kein authenticated DELETE nötig |
| Kontakte CRUD | `saveClubContactAction` / `deleteClubContactAction` | `settings.edit` | authenticated SSR | INSERT/UPDATE/DELETE |
| Bilder | Media-Service → `synchronize_media_assignment` | jeweiliger Action-Guard plus Media-Prüfung | service_role RPC | RPC bleibt service_role-only |

Die RLS-Policies bilden die heutige relationale Permission-Matrix ab. Die feineren Team-, Personen- und Own-card-Scopes verbleiben in den bestehenden Server Actions und werden nicht verändert. Dadurch bleibt der heutige doppelte Vertrag erhalten: Datenbank-Permission als Mindestgrenze, serverseitiger Scope als engere fachliche Grenze. Ein authenticated Benutzer ohne passende Permission kann keine Mutation ausführen.

## Proposal-Zielzustand

- RLS ist auf allen drei Tabellen aktiv, ohne FORCE RLS.
- anon besitzt ausschließlich SELECT. Öffentliche Policies liefern nur aktive Trainer, aktive Vorstandsmitglieder und aktive öffentliche Clubkontakte.
- authenticated besitzt SELECT sowie nur die für bestehende SSR-Pfade nötigen DML-Rechte: Coaches INSERT/UPDATE/DELETE, Board INSERT/UPDATE, Contacts INSERT/UPDATE/DELETE. RLS verlangt je Operation den passenden Permission-Key beziehungsweise Superadmin; insbesondere berechtigt `coaches.create` nicht zu DELETE.
- TRUNCATE, REFERENCES und TRIGGER werden PUBLIC, anon und authenticated entzogen. Alle alten Spalten-Grants werden ebenfalls entzogen.
- service_role behält volle Tabellenrechte und den exklusiven EXECUTE-Vertrag der beiden geprüften RPCs.
- Weder Rollenmatrix noch Daten, Verknüpfungen, Notification-, Membership-, E-Mail- oder Media-Architektur werden verändert.

## Public-Read-Datensparsamkeit

Der Block schließt primär direkte Mutationen und beschränkt öffentliche Zeilen auf aktive beziehungsweise explizit öffentliche Datensätze. PostgreSQL-RLS begrenzt Zeilen, nicht einzelne Spalten. Weil bestehende öffentliche Seiten derzeit direkt aus diesen Tabellen lesen, würde ein sofortiger Spaltenentzug eine View/RPC- und Frontendumstellung erfordern und den erlaubten Scope überschreiten. Die mögliche Offenlegung von `email`, `phone`, `whatsapp`, `admin_profile_id` und Legacy-Feldern sollte deshalb in einem separaten Public-Read-Minimierungsblock über kontrollierte Projektionen untersucht werden.

## Manuelle Reihenfolge

1. Vor Ausführung aktuellen Stand sichern und Proposal nochmals prüfen.
2. `../sql/b15-23b1-person-security-hardening-proposal.sql` einmal manuell ausführen.
3. Unmittelbar danach `../sql/b15-23b1-person-security-hardening-postcheck-readonly.sql` ausführen und alle Rechte/Policies prüfen.
4. Öffentliche Trainer-, Vorstands- und Kontaktseiten testen.
5. Superadmin sowie mindestens eine berechtigte eingeschränkte Rolle für die jeweiligen CRUD-/Archivpfade testen.
6. Anon- und authenticated-Negativtests ohne echte Datensatz-IDs durchführen.
7. Rollback nur bei einem bestätigten Problem und erst nach Prüfung seines fail-closed Guards ausführen.

Das SQL wurde von Codex nicht ausgeführt. Das Proposal wurde anschließend durch den Benutzer manuell freigegeben und erfolgreich angewendet.

## Manueller Regressionstest

Der Benutzer bestätigte nach dem Live-Hardening:

- Superadmin und ein berechtigter Nicht-Superadmin können Trainer entsprechend ihren bestehenden Rechten weiter bearbeiten und speichern.
- Die Änderungen erscheinen weiterhin korrekt auf der öffentlichen Website; bestehende Rollen-/Permission-Grenzen bleiben wirksam.
- Vorstandspfad, Kontaktverwaltung und Bild-/Media-Zuordnungen funktionieren weiterhin.
- Es ist keine neue unberechtigte Verwaltungsfunktion sichtbar und keine funktionale Regression durch das Hardening aufgetreten.

## Verbindlicher Trainer-Archivierungsgrundsatz

Trainer werden im normalen Dashboardbetrieb nicht physisch gelöscht. Der Fachworkflow ist Deaktivieren/Archivieren und bei Bedarf späteres Reaktivieren; der Datensatz bleibt erhalten. Eine physische Löschung oder Legacy-Bereinigung darf ausschließlich in einem späteren, bewusst geplanten Datenbank-/Cleanup-Block erfolgen. Es wird keine neue Trainer-Delete-UI eingeführt. Bestehende interne Delete-Permissions oder `remove_entity('coach', …)` werden durch B15.23B1 nicht entfernt, sind aber ausdrücklich kein normaler Dashboard-Fachworkflow.
