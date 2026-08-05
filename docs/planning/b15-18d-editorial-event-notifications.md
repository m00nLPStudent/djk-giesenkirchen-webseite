# B15.18D – Redaktionelle und terminbezogene Benachrichtigungen

## 1. Ziel

Vorhandene redaktionelle und terminbezogene Mutationen werden ausschließlich dann an das zentrale Notification Center angebunden, wenn ein realer Workflow und eine stabile Empfängerbeziehung existieren.

## 2. Bestandsanalyse

News besitzen `is_published` und `published_at`; Entwurf, geplant und veröffentlicht werden daraus abgeleitet. Erstellen und Bearbeiten laufen über `saveNewsWithAuthorAction`, Löschen über den vorhandenen `remove_entity`-Pfad. `author` ist ausschließlich ein Anzeigename. Separate Review-, Rückgabe- und Ablehnungsaktionen existieren nicht.

Persistierte Termine besitzen Create/Update, `is_published`, Zeit, Ort, `event_type`, optionale `team_id` und Wiederholungsfelder. Es gibt keine Datensatz-Delete-Action und keinen Cancel-Status. Virtuelle Trainings werden beim Lesen aus `team_training_times`, `team_training_exceptions` und `club_closure_periods` erzeugt.

CMS-Seiten besitzen Create/Update/Delete sowie `is_published` und `show_in_footer`. Es gibt keine stabile Erstellerreferenz und keine Review-, Rückgabe- oder Ablehnungsaktion. News-, Event- und Settings-Permissions bleiben unverändert.

## 3. Unterstützte News-Ereignisse

Keine Notification wird seriös erzeugt: Es fehlt für alle fachlich sinnvollen Rückmeldungen eine stabile Empfängerbeziehung.

## 4. Blockierte News-Ereignisse

Erstellt, veröffentlicht, relevant geändert und gelöscht sind `BLOCKED`, weil `author` nur Freitext ist. Revision und Ablehnung sind `DEFERRED`, weil kein Workflow existiert. Geplante Veröffentlichung besitzt keinen nachweisbaren serverseitigen Publish-Job; ein zukünftiger Zeitpunkt im Datensatz ist keine Mutation.

## 5. Autoren-/Erstellerauflösung

Es erfolgt ausdrücklich keine Auflösung über Vorname, Nachname, Anzeigename oder vermutete E-Mail. Für eine spätere Anbindung wäre eine stabile Auth-User- oder Adminprofilreferenz nötig; sie ist nicht Teil dieses Pakets.

## 6. Unterstützte Terminereignisse

`event_created` wird nach erfolgreichem Anlegen eines persistierten Mannschaftstermins erzeugt. `event_updated` entsteht nur, wenn Titel, Zeit, Ort, Terminart, Mannschaft, Publikationsstatus oder wesentliche Beschreibung tatsächlich geändert wurden. Unverändertes Speichern erzeugt nichts.

## 7. Mannschaftstermine

Empfänger sind aktive Coaches mit Adminkonto aus der aktiven Team-Saison. Beim Mannschaftswechsel werden alte und neue Team-Saison gemeinsam und batchweise aufgelöst. Der Actor wird entfernt und Mehrfachzuordnungen werden durch die zentrale Idempotenz-/Batchschicht dedupliziert.

## 8. Trainingszeiten und Ausnahmen

Die realen Schreibvorgänge liegen derzeit in Clientservices. Eine vertrauenswürdige Notification benötigt eine autorisierte Servermutation mit Vorher-/Nachher-Snapshot. Diese Umstellung wird nicht verdeckt in D vorgenommen. Änderungen, Entfernen und Trainingsabsagen sind deshalb `DEFERRED`. Virtuelle Instanzen und Kalenderberechnungen erzeugen grundsätzlich keine Notification. Für Vereinsschließzeiten wurde keine Admin-Schreibaktion gefunden.

## 9. Unterstützte CMS-Ereignisse

Keine Empfängerbenachrichtigung ist ohne stabile Ersteller- oder Verantwortlichenreferenz sicher möglich.

## 10. Blockierte CMS-Ereignisse

Erstellen, Aktualisieren, Publizieren, Deaktivieren und Löschen sind hinsichtlich einer Rückmeldung `BLOCKED`. Review und Überarbeitung sind `DEFERRED`, weil diese Fachaktionen nicht existieren.

## 11. Empfängerregeln

Mannschaftstermine verwenden ausschließlich den bestehenden aktuellen Saisonresolver, `team_seasons`, aktive `coach_team_seasons`, aktive Coaches und deren vorhandene Adminkonten. Allgemeine Vereinstermine werden nicht pauschal verteilt, weil keine verantwortliche Person gespeichert ist.

## 12. Actor-Ausschluss

Die bestehende Empfängerauflösung entfernt das auslösende Adminprofil. Bei ausschließlich eigener Zuständigkeit entsteht kein leerer Insert.

## 13. Zielrouten

Empfänger mit `events.edit` erhalten `/admin/events/edit/[id]`. Bei veröffentlichten Terminen ohne Editrecht wird `/termine/[slug]` verwendet. Ohne sichere Fachroute bleibt `/admin/notifications`.

## 14. Notification-Detail

Nicht veröffentlichte Termine ohne Editrecht sowie später nicht mehr erreichbare Inhalte verbleiben im Notification Center. Gelöschte News, Events oder Seiten erhalten in D keine Meldung, weil dafür keine stabile Empfängerbeziehung beziehungsweise keine Event-Delete-Action existiert.

## 15. Idempotenz

Es wird ausschließlich `createNotificationsOnce()` mit dem vorhandenen Fünf-Minuten-Fenster verwendet. Der Schlüssel enthält Typ, Termin-ID, Änderungszeitpunkt und Team-ID.

## 16. Datenschutz

Gespeichert werden nur Termin-ID, Slug, Team/Saison, Zeitpunkt, optionaler Ortsname, Terminart, Publikationsstatus und geänderte Feldnamen. HTML-Inhalte, Kontaktdaten, interne Notizen, Finanz- oder Gesundheitsdaten werden ausgeschlossen.

## 17. Fehlerverhalten

Notifications werden erst nach erfolgreicher Mutation erzeugt. Zustellfehler werden strukturiert protokolliert und rollen die fachliche Speicherung nicht zurück.

## 18. Performance

Aktuelle Saison, betroffene Team-Saisons, Zuordnungen, Profile, Rollen und Permissions werden batchweise geladen. Es gibt keine Empfängerquery innerhalb einer Schleife und keinen Client-Insert in `notifications`.

## 19. Tests

Core-Tests prüfen Planbildung, relevante Änderungen, Mannschaftswechsel, Datenschutz und sichere Zielrouten. Integrationstests prüfen Mutationsreihenfolge, Berechtigungen, zentrale Batchauflösung sowie fehlende stabile News-/CMS-Erstellerreferenzen. Die bestehende Notification-Regression bleibt Teil des Gesamtlaufs.

## 20. Risiken

Trainer ohne `events.edit` erreichen bei unveröffentlichten Terminen nur die Notification-Detailansicht. Trainingsmutationen bleiben bis zu einem separaten autorisierten Serverpfad ohne Notification. Eine geplante News wird ohne existierenden Scheduler nicht als eigenständige Veröffentlichung erkannt.

## 21. Empfehlung für B15.18E

Ein Folgepaket sollte stabile redaktionelle Ownership separat fachlich entscheiden und – falls gewünscht – per eigener Datenmodellmigration vorbereiten. Davon getrennt können Trainingszeiten und Ausnahmen auf bestehende serverseitige Team-Scope-Actions umgestellt und anschließend sicher angebunden werden.
