# B15.18B – Benachrichtigungen für Mannschaftszuordnungen

## 1. Ziel

Spieler- und Trainerzuordnungen erzeugen nach erfolgreichem Fachabschluss persönliche In-App-Benachrichtigungen. Es wurden weder Datenmodell noch Permissions, Scopes, RLS oder UI erweitert.

## 2. Vorhandene Fachaktionen

`savePlayerWithScopeAction` und `saveCoachWithScopeAction` sind die personenzentrierten Formular-Schreibpfade. `removePlayerWithScopeAction` und `removeCoachWithScopeAction` archivieren über die vorhandene kompensierende Archivierungsarchitektur. Zusätzlich ersetzt `saveTeamWithScopeAction` die im Mannschaftsformular gepflegten Kader- und Trainerlisten; dieser Pfad vergleicht Vorher-/Nachher-Snapshots erst nach vollständig erfolgreichem Save.

## 3. Empfängerermittlung

Spielerereignisse laden aktive `coach_team_seasons` der exakt betroffenen Team-Saison, anschließend Coaches, Adminprofile, Rollen und Permissions in Batch-Abfragen. Inaktive Zuordnungen, inaktive Coaches, inaktive Adminprofile, fremde Team-Saisons, fehlende Konten, Duplikate und der Actor werden entfernt.

## 4. Trainer–Admin-Verknüpfung

Verwendet wird ausschließlich `coaches.admin_profile_id`. Das Projekt erzeugt `admin_profiles.id` mit der UUID des Auth-Benutzers. Der historische E-Mail-Fallback der Anmeldung wird nicht für Notifications übernommen; Namen werden niemals zur Verknüpfung verwendet. Nicht auflösbare Trainer erhalten keine In-App-Nachricht.

## 5. Spielerzuordnung

CREATE und REACTIVATE erzeugen `player_assigned` für aktive verantwortliche Personen der Ziel-Team-Saison.

## 6. Spielerentfernung

Archivierung oder das Beenden einer Zuordnung erzeugt `player_removed` für die bisherige Team-Saison.

## 7. Mannschaftswechsel

Ein Wechsel erzeugt getrennt `player_removed` für die alte und `player_assigned` für die neue Team-Saison. Derselbe Empfänger kann beide fachlich unterschiedlichen Ereignisse erhalten, niemals dasselbe Ereignis doppelt.

Auch der Mannschaftseditor erzeugt anhand der tatsächlichen Vorher-/Nachher-Differenz dieselben fachlichen Spieler- und Trainerereignisse. Unverändert erneut eingesetzte Listen bleiben still, obwohl die bestehende Fachlogik Zuordnungszeilen technisch ersetzt.

## 8. Trainerzuordnung

Neue oder reaktivierte Zuordnungen erzeugen `trainer_assigned` ausschließlich für die zugeordnete Person mit aktivem Adminprofil.

## 9. Trainerentfernung

Entfernung und Archivierung erzeugen `trainer_removed` für die betroffene Person. Ist diese der Actor, wird keine Selbstbenachrichtigung erzeugt.

## 10. Funktionsänderung

Eine tatsächlich geänderte normalisierte Rolle erzeugt `trainer_changed`. Unveränderte Rollen und rein technische Saves erzeugen nichts.

## 11. Saisonlogik

Events übernehmen `seasonId`, Saisonlabel und `teamSeasonId` aus der bereits aufgelösten aktuellen Team-Saison. Historische Zuordnungen werden nicht als Empfänger- oder Änderungsquelle verwendet.

## 12. Actor

`actor_user_id` stammt aus der authentifizierten Server Action. Der Actor wird vor der Erstellung aus der Empfängerliste entfernt.

## 13. Sichere Zielrouten

Spieleredit erfordert `players.edit`, Trainerdetail `coaches.edit`, Mannschaftsdetail `teams.view`. Fehlt die jeweilige Permission, wird eine zulässige Teamroute oder abschließend `/admin/notifications` verwendet. Bestehende Teamzuordnung begründet den vorhandenen Team-Scope; entfernte Personen erhalten vorsorglich den sicheren Notification-Center-Fallback.

## 14. Datenschutz

Gespeichert werden nur Name, Mannschaft, Saison, Rollenlabel, fachlicher Aktionstyp und technische Zuordnungs-IDs. Geburtsdatum, Kontaktinformationen, Beiträge, Zahlungen, interne Notizen und medizinische Daten bleiben ausgeschlossen.

## 15. Fehlerverhalten

Notifications entstehen erst nach erfolgreicher Fachmutation beziehungsweise erfolgreichem Archivierungs-Postcheck. Ein Notification-Fehler wird mit dem Präfix `[assignment-notification]` protokolliert. Die bereits erfolgreiche Fachmutation wird nicht zurückgerollt und dem Benutzer wird keine Zustellung zugesichert.

## 16. Idempotenz

Unveränderte Saves liefern `UNCHANGED_ASSIGNMENT` und erzeugen kein Event. Empfänger werden pro Event dedupliziert. Die zentrale Batch-Erstellung prüft `recipient + type + idempotencyKey` innerhalb eines fünfminütigen Retry-Fensters. Eine absolute Nebenläufigkeitsgarantie wäre erst mit einem eindeutigen Datenbankindex möglich und ist ohne Schemaänderung bewusst nicht Teil von B15.18B.

## 17. Notification-Texte

Alle deutschen Texte werden zentral in `assignmentNotification.core.mjs` gebaut. Fachactions enthalten keine eigenen Notification-Strings.

## 18. Tests

Core-, Sicherheits-, UI-, Integrations-, Spieler-, Trainer-, Archivierungs-, Permission- und Scope-Regressionen decken Builder, Rollen, Empfänger, Actor-Ausschluss, Deduplizierung, Reihenfolge und Rollback ab.

## 19. Risiken

Legacy-Adminprofile, deren UUID nicht der Auth-UUID entspricht, werden über die feste Coach-Verknüpfung gefunden, können wegen des Notification-Fremdschlüssels aber nicht sicher beliefert werden. Für solche Altprofile ist eine separate Datenbereinigung außerhalb dieses Auftrags erforderlich. Vollständig parallele identische Mutationen bleiben ohne eindeutigen Datenbankindex theoretisch möglich.

## 20. Empfehlung für B15.18C

Als Nächstes sollten redaktionelle Workflow-Ereignisse angebunden werden. Vorher empfiehlt sich ein Monitoring für fehlgeschlagene Notification-Zustellungen sowie eine getrennt freizugebende Idempotency-Key-Erweiterung des Schemas.
