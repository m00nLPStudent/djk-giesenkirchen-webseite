# B15.18H – Persönliche Benachrichtigungseinstellungen

## 1. Ziel
Authentifizierte Adminbenutzer steuern ausschließlich ihre zukünftigen optionalen In-App-Meldungen. E-Mail, Push, SMS und bestehende Meldungen bleiben unberührt.

## 2. Bestandsanalyse
Geprüft wurden zentrale Services, Builder, Resolver, Audit, Glocke, Center, Profil, Rollen, `admin_profiles`, RLS und Self-Service-Actions. Produktiv erzeugt werden die in der Matrix als `currently_produced=true` markierten Typen.

## 3–6. Typen, Gruppierung und Verbindlichkeit
Die einzige Definition liegt in `notificationPreferencePolicy.mjs`. Gruppen sind Spieler & Mannschaft, Mitgliedschaft, Beiträge, Termine & Training, Redaktion und System. Persönliche Trainerzuordnungen, persönliche Anfragezuweisung/-weiterleitung/-rückmeldung sowie Systeminformationen sind verpflichtend. Alle übrigen registrierten Typen sind optional. Unbekannte Typen bleiben aktiviert und unsichtbar in der UI.

## 7–9. Datenmodell, Default und RLS
`notification_preferences` verwendet dieselbe Auth-UUID wie `notifications.recipient_user_id`. Unique ist `(user_id, notification_type)`. Fehlende Zeile bedeutet aktiviert; gespeichert wird primär der Opt-out. RLS erlaubt SELECT/INSERT/UPDATE/DELETE ausschließlich bei `user_id=auth.uid()`. Auch Superadmins erhalten keinen Fremdzugriff.

## 10–12. Repository, Service und Zustellung
Das Repository unterstützt Self-Service und Batch-Lesen per gemeinsamer `IN`-Query. Alle drei zentralen Create-Funktionen filtern nach Actor-Ausschluss/Deduplizierung und vor dem Insert. Fachservices enthalten keine Preference-Logik. Lookupfehler sind fail-open und werden als `notification_preference_lookup_failed` auditiert.

## 13–15. Seite, Sammelaktionen und unbekannte Typen
`/admin/notifications/settings` ist serverseitig authentifiziert und zeigt verständliche deutsche Gruppen, zugängliche Schalter und den Chip „Erforderlich“. Sammelaktionen aktivieren/deaktivieren nur optionale Typen oder stellen den Default wieder her. Ohne Tabelle erscheint ein Setup-State; Zustellung bleibt aktiv.

## 16–20. Audit, Datenschutz, Fehler, Performance und Retry
Das vorhandene Audit-`metadata` enthält ausschließlich `inputCount`, `skippedCount`, `outputCount` und `mandatoryType`. Keine Preference-Inhalte, Namen oder Texte werden gespeichert. Pro Batch gibt es eine Preference-Query. Retry bleibt deaktiviert; ein späterer Retry muss aktuelle Preferences erneut prüfen.

## 21. Tests
Policy, Repositorystruktur, zentrale Zustellreihenfolge, Fail-open, Audit, UI, Auth-Guard und RLS werden statisch und über Core-Tests geprüft. Der manuelle Test nach SQL-Ausführung folgt dem 14-Schritte-Ablauf aus dem Auftrag.

## 22. SQL-Ausführung
Nicht automatisch ausgeführt. Reihenfolge: Schema, RLS, Read-only-Postcheck, Browserabnahme. Rollback entfernt nur `notification_preferences`.

## 23. Risiken
Vor SQL-Ausführung ist nur der Setup-State verfügbar. Batch-Zustellung benötigt den bereits etablierten vertrauenswürdigen serverseitigen Notification-Client, während UI-Zugriffe vollständig der Self-RLS unterliegen. `event_*` wird heute sowohl für Termine als auch Training verwendet und kann deshalb nicht feiner konfiguriert werden, ohne bestehende Typen zu ändern.

## 24. Empfehlung für B15.18I
Nach SQL-Abnahme sollten reale rollenübergreifende Zustellungen, parallele Sammelaktionen und Monitoring-Aggregate unter Produktionslast geprüft werden. Retry erst danach separat konzipieren.
