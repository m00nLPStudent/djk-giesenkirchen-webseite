# B15.18E – Trainingszeiten, Ausnahmen und Absagen

## 1. Ziel

Die real vorhandenen Trainingsmutationen werden authentifiziert, permission- und scopegeprüft serverseitig ausgeführt und erst nach erfolgreichem Postcheck an die zentrale Notification-Infrastruktur angebunden.

## 2. Bestandsanalyse

Die Verwaltung besitzt vollständiges CRUD für Trainingszeiten und Trainingsausnahmen. Alle sechs Mutationen wurden zuvor unmittelbar über den Browser-Supabase-Client ausgeführt. Virtuelle Trainings werden ausschließlich lesend erzeugt. Für Vereinsschließzeiten existiert ein Read-Modell, aber keine Admin-Schreibaktion.

## 3. Tabellen und Fachmodelle

`team_training_times` enthält Team-Saison, Wochentag, Beginn, Ende, Trainingsart, Ort, Aktivstatus, Gültigkeitszeitraum und Notiz. `team_training_exceptions` enthält Trainingszeit, Datum, Typ, abweichende Zeit/Ort, Aktivstatus und Notiz. Nachweisbare Ausnahmetypen sind ausschließlich `cancelled` und `moved`. `club_closure_periods` wird vom Event-Loader gelesen.

## 4. Bisherige Clientmutationen

Create, Update und Delete beider Trainingsmodelle lagen in `training.service.js`. Der Service enthält nach E ausschließlich die bestehenden Lesezugriffe; die React-Manager rufen nun Server Actions auf.

## 5. Neue Servermutationen

Eingeführt wurden Create/Update/Delete für Trainingszeiten und Trainingsausnahmen. Jede Action lädt Authentifizierung, Permission, Scope, Datensatz- und Team-Saison-Kontext, führt genau eine Fachmutation aus, prüft den Rückgabedatensatz beziehungsweise die Löschung und revalidiert vor der Best-effort-Notification.

## 6. Permission und Scope

Verwendet wird ausschließlich `teams.edit`. `loadServerTeamScopeContext()` und `canAccessTeamOnServer()` prüfen den vorhandenen Scope gegen die reale Mannschaft der Team-Saison. Bei einem Team-Saison-Wechsel müssen alter und neuer Scope erlaubt sein. Normale Fachmutationen verwenden den authentifizierten Serverclient, nicht die Service Role.

## 7. Trainingszeit erstellt

Ein erfolgreicher Create-Postcheck erzeugt `event_created` mit „Neue Trainingszeit“. Array-Erstellung für mehrere ausgewählte Wochentage bleibt erhalten. Jede tatsächlich erstellte Zeit wird fachlich separat beschrieben.

## 8. Trainingszeit geändert

`event_updated` entsteht nur bei Änderungen an Team-Saison, Wochentag, Zeit, Trainingsart, Ort, Aktivstatus oder Gültigkeit. Unverändertes Speichern erzeugt nichts.

## 9. Trainingszeit entfernt

Nach erfolgreichem Delete und negativem Existenz-Postcheck entsteht `event_cancelled` mit „Trainingszeit entfernt“. Das Ziel bleibt die persönliche Notification-Detailansicht und verweist nie auf den gelöschten Datensatz.

## 10. Trainingsausnahmen

Nur die vorhandenen Typen `cancelled` und `moved` werden unterstützt. Das bisherige leere Ausnahmen-Draft kann weiterhin angelegt werden; ohne Datum entsteht noch keine Notification. Erst eine fachlich vollständige Änderung mit Datum wird zugestellt.

## 11. Absagen

Eine aktive `cancelled`-Ausnahme mit Datum erzeugt `event_cancelled` und „Training abgesagt“. Die Meldung enthält Mannschaft und Datum, aber keine Notiz oder vollständigen Formulardaten.

## 12. Verschiebungen

Eine aktive `moved`-Ausnahme erzeugt `event_updated` und „Training verschoben“. Vorhandene Override-Felder bleiben fachlich unverändert erhalten.

## 13. Rücknahmen

Das Löschen einer Ausnahme oder ihre Deaktivierung erzeugt `event_updated` und „Training findet wieder statt“. Die persönliche Detailansicht wird bevorzugt, weil die Ausnahme nach Delete nicht mehr existiert.

## 14. Vereinsschließzeiten

Es wurde keine reale Admin-Schreibaktion gefunden. Die Anbindung ist `DEFERRED`; weder Service-Role-Workaround noch neuer Workflow wurde ergänzt.

## 15. Empfängerermittlung

Es wird ausschließlich der bestehende Team-Recipient-Resolver verwendet. Er lädt aktive saisonale Coach-Zuordnungen, aktive Coaches, stabile Adminprofile, Rollen und Permissions batchweise. Andere Teams und pauschale Adminrollen werden nicht aufgenommen.

## 16. Actor-Ausschluss

Der Actor wird über die bestehende Profil-ID ausgeschlossen. Ist er alleiniger Empfänger, entsteht weder Insert noch Fehler. Deduplizierung bleibt zentral.

## 17. Zielrouten

Bei bestehendem Fachdatenkontext und `teams.view` wird `/admin/teams/[id]` verwendet. Entfernte Trainingszeiten und gelöschte Ausnahmen führen ausschließlich zum Notification Center. Ohne sichere Teamroute gilt ebenfalls der Detail-Fallback.

## 18. Idempotenz

`createNotificationsOnce()` und das vorhandene Zeitfenster bleiben maßgeblich. Der Schlüssel enthält Typ, Datensatz-ID, Aktion und den vorhandenen Änderungszeitpunkt. Unveränderte Saves werden bereits vor Zustellung verworfen.

## 19. Fehlerverhalten

Permission-, Scope-, Existenz-, Mutations- und Postcheckfehler erzeugen keine Notification. Zustellfehler werden protokolliert, rollen die erfolgreiche Fachmutation aber nicht zurück.

## 20. Performance

Der Empfängerresolver lädt Zuordnungen, Coaches, Profile, Rollen und Permissions in Batches. Es gibt keine Query pro Trainer, virtueller Instanz oder Notification-Karte.

## 21. Revalidation

Nach erfolgreicher Mutation werden Admin-Termine, Mannschaftsübersicht, konkrete Mannschaft und bestehende öffentliche Event-/Trainingsbereiche über die vorhandene Revalidation aktualisiert. Der Notification-Service übernimmt keine Cachepflege.

## 22. Tests

Core-Tests prüfen Normalisierung, Pläne, unveränderte Saves, Texte, Absage, Verschiebung, Rücknahme, Datenschutz und Ziele. Integrationstests prüfen alle sechs Actions, Permission, Scope, Reihenfolge, Postcheck, Clientmigration, Batchzustellung, Revalidation und das Fehlen von Notifications in Read-/Virtualisierungspfaden.

## 23. BLOCKED/DEFERRED

Vereinsschließzeiten bleiben `DEFERRED`, da keine Schreibaktion existiert. Ein Wechsel der Trainingszeit zu einer anderen Team-Saison ist serverseitig abgesichert, wird von der aktuellen UI aber nicht angeboten. Weitere Ausnahmetypen sind `NOT_APPLICABLE`.

## 24. Risiken

Die RLS-Policies können nur in einer realen Umgebung vollständig verifiziert werden. Bei einer RLS-Ablehnung liefert die Action einen Fehler und erzeugt keine Notification. Der bestehende Draft-Ablauf für Ausnahmen speichert weiterhin zunächst einen unvollständigen Datensatz, meldet ihn jedoch nicht.

## 25. Empfehlung für B15.18F

Als nächster Schritt sollte die reale Mehrkonten- und RLS-Prüfung automatisiert werden. Eine zukünftige Schließzeiten-Anbindung sollte erst erfolgen, wenn eine echte scopegesicherte Adminmutation vorhanden ist.
