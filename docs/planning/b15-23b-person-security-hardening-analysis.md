# B15.23B – Security-Hardening bestehender Personen-/Funktionsdaten

## Status und feste Grenzen

B15.23A ist als Repository-Analyse abgeschlossen. Das bestehende Benutzer-, Rollen- und Funktionsmodell bleibt unverändert; eine `persons`-Tabelle oder Personenmigration ist nicht geplant. B15.23B befindet sich bis zur manuellen Auswertung von `../sql/b15-23b-person-security-preflight-readonly.sql` ausschließlich im Analysezustand. Es wurden weder SQL noch Anwendungs-, Rollen-, Personen- oder Testdaten verändert.

## Statisch belegte Auffälligkeiten

Historische Inventardaten weisen für `coaches` die Policies `Allow public insert coaches`, `Allow public update coaches` und `Allow public delete coaches` sowie für `board_members` die Policies `board_members_insert_all`, `board_members_update_all` und `board_members_delete_all` aus. Sie gelten jeweils für `PUBLIC` und verwenden uneingeschränktes `true`; bei aktivem RLS und passenden Grants wären sie keine fachliche Autorisierung.

Für `club_contacts` sind historische `*_admin`-Policies mit `auth.jwt()->'app_metadata'->>'role' = 'admin'` und eine Public-Read-Policy dokumentiert. Der B15.23A-Live-Befund nennt RLS jedoch als deaktiviert; dann begrenzen diese Policies keinen Zugriff. Die `app_metadata`-Einzelrolle entspricht zudem nicht der heutigen relationalen Rollen-/Permission-Auswertung und darf nicht als künftige fachliche Sicherheitsgrenze vorausgesetzt werden.

Ob `PUBLIC`, `anon` oder `authenticated` daraus heute effektiv schreiben kann, hängt zusätzlich von Tabellen- und Spalten-Grants sowie mutierenden Funktionen ab. Genau diese Live-Fakten erhebt der ergänzende Preflight; vor dessen Auswertung ist weder eine Gefährdung abschließend bestätigt noch ein Proposal freigegeben.

## Tatsächliche Anwendungspfade

| Bereich | Create/Update/Delete | Client und Autorisierung | Regressionsrisiko |
|---|---|---|---|
| Trainer | `saveCoachWithScopeAction`, `removeCoachWithScopeAction`; Repository schreibt `coaches` und saisonale Zuordnungen, Löschen ist fachlich Archivierung | Server Action prüft `coaches.create/edit/delete` plus Team-/Person-Scope; Mutation nutzt den sessiongebundenen SSR-Client | Entzug von `authenticated`-Grants oder bisherigen Write-Policies kann den legitimen Flow brechen |
| Vorstand | `saveBoardMemberWithScopeAction`, `removeBoardMemberWithScopeAction` | Server Action prüft `settings.edit` plus Person-Scope; Create/Update nutzt sessiongebundenen SSR-Client, Hard-Delete nach Guard bereits Service Role | Create/Update sind von authenticated-RLS/Grants abhängig; Delete nicht pauschal als Browserpfad behandeln |
| Clubkontakte | `saveClubContactAction`, `deleteClubContactAction` | Server Action prüft `settings.edit`; Lesen und Mutationen nutzen den sessiongebundenen SSR-Client | Aktivierung von RLS oder Grant-Entzug ohne Ersatz würde Kontaktverwaltung wahrscheinlich brechen |
| Medienlinks | `synchronizeMediaAssignment` ruft `synchronize_media_assignment` auf | zentraler Media-Service verwendet einen server-only Adminclient; Live-EXECUTE-Grants müssen bestätigt werden | Die Funktion mutiert unter anderem alle drei Zieltabellen und muss als eigener kontrollierter Schreibweg erhalten bleiben |

Die UI-Guards sind nicht allein maßgeblich: Alle genannten legitimen Mutationen passieren in Server Actions nach Permission-/Scope-Prüfung. Der darin verwendete SSR-Client bleibt aber technisch ein `authenticated`-Datenbankakteur. Ein späteres Hardening muss daher entweder eng passende Datenbankregeln beibehalten oder diese konkreten Serverpfade kontrolliert auf einen server-only Schreibweg umstellen. Eine pauschale RLS-/Grant-Entfernung ist nicht regressionssicher.

## Bewertung alter Policies

- Uneingeschränkte `PUBLIC`-Write-Policies auf `coaches` und `board_members` sind potentiell gefährlicher Altbestand und fachlich nicht erforderlich, sobald ein sicherer Ersatz für die legitimen Server Actions nachgewiesen ist.
- Public-Read muss für die öffentliche Trainer-/Vorstand-/Kontaktanzeige erhalten bleiben, jedoch nur im fachlich vorgesehenen aktiven/öffentlichen Umfang. Der Live-Ausdruck der Policies ist vor einer Änderung maßgeblich.
- `club_contacts_*_admin` mit JWT-`app_metadata.role = admin` ist historisch und inkompatibel mit der heutigen Mehrrollen-/Permission-Architektur. Sie darf nicht blind reaktiviert werden.
- Trigger- und Media-Synchronisationsfunktionen sind keine austauschbaren Policies. Owner, `SECURITY DEFINER`, `search_path` und effektive EXECUTE-Rechte müssen vor jeder Härtung geprüft werden.

## Ziel und Testmatrix für einen späteren Proposal-Block

Ohne Änderung der Rollenmatrix sollen direkte anonyme und unautorisierte authentifizierte INSERT/UPDATE/DELETE-Zugriffe geschlossen, Service-Role-Pfade erhalten und fachlich erforderliche Public-Reads bewahrt werden. Positiv zu testen sind Superadmin- und berechtigte Rollen für Trainer, Vorstand und Kontakte sowie öffentliche aktive Datensätze. Negativ zu testen sind alle drei Mutationen für anon und einen authenticated User ohne Permission sowie ein Trainer ohne Vorstandsrecht. TRUNCATE, REFERENCES, TRIGGER, Spalten-Grants und mutierende RPCs gehören ausdrücklich zur Negativmatrix.

Das Hauptrisiko liegt nicht in der Rollenmatrix, sondern in der derzeitigen Kopplung legitimer serverseitiger Workflows an den sessiongebundenen Client. Voraussichtlich ist eine Schließung ohne Rollenmatrixänderung möglich, aber erst nach Live-Auswertung und mit einem bewusst gewählten server-only beziehungsweise eng kontrollierten Mutationsweg. Noch wird kein Proposal erstellt.

## Separater Folgeblock B15.23C

B15.23C betrifft ausschließlich das eingeloggte Dashboardprofil: bessere Profilübersicht, optionaler Nickname/Anzeigename, offizieller Name, Login-E-Mail, Accountstatus, Rollen sowie rein lesende Anzeige verknüpfter Trainer-/Vorstandsfunktionen. Ein eigenes Dashboardbild wird über die zentrale Medienbibliothek als separater Verwendungszweck geführt und bleibt unabhängig von Trainer- und Vorstandsbild. Keine zweite Uploadarchitektur und keine E-Mail-Synchronisierung.

## Entscheidungspunkt

Nach manueller Ausführung des Read-only-Preflights werden die effektiven Rechte und Funktionen ausgewertet. Erst dann wird entschieden, ob und wie ein separates Proposal, Rollback und Postcheck erstellt werden. Bis dahin bleibt B15.23B offen.

## Live-Auswertung / B15.23B1

Der manuelle Preflight hat die Sicherheitsauffälligkeit als real bestätigt: anon und authenticated besitzen auf allen drei Tabellen effektive Schreib- und Sonderrechte; offene PUBLIC-Policies beziehungsweise deaktiviertes RLS lassen diese Rechte wirksam werden. Die beiden mutierenden RPCs `remove_entity` und `synchronize_media_assignment` sind dagegen bereits service_role-only. Das darauf basierende, noch nicht ausgeführte B15.23B1-Design ist in [`b15-23b1-person-security-hardening-live-design.md`](b15-23b1-person-security-hardening-live-design.md) dokumentiert.

B15.23B ist damit als Security-Analyse abgeschlossen. Das B15.23B1-Proposal wurde anschließend manuell erfolgreich ausgeführt und durch Read-only-Postcheck sowie Browsertest bestätigt; der finale Live-Zustand ist im verlinkten Live-Design dokumentiert.
