# B15.5A – Dashboard-Sichtbarkeit für Mitgliedsanfragen

## 1. Ausgangslage

Das B15.5-Dashboard zeigte den aggregierten Zähler offener Mitgliedsanfragen auch dem Kassierer.

## 2. Root Cause

Der Dashboard-Queryplan verwendete ausschließlich `settings.view`. Dieser breite Key gehört auch zum Kassierer-Kontext. Dadurch wurde die Count-Query serverseitig ausgeführt und anschließend eine Notice erzeugt; es handelte sich nicht nur um eine UI-Ausblendung. Zusätzlich ist selbst `membership_requests.view` im Bestands-Seed dem Kassierer zugeordnet und deshalb allein keine geeignete Zielgruppenentscheidung.

## 3. Verbindliche Sichtbarkeitsregel

Sichtbar sind Superadmin, Vorstand sowie Jugendleiter beziehungsweise der vorhandene Jugendkoordinator-Kompatibilitätsfall. Kassierer, Trainer, Betreuer und Gast erhalten weder Query noch DTO-Notice.

## 4. Verwendete Permission-/Scope-Quelle

`canViewMembershipRequestsOnDashboard` ist die einzige Policy. Superadmin wird über globalen Scope beziehungsweise den kanonischen technischen Key erkannt. Vorstand benötigt den technischen Key `vorstand` und `membership_requests.view`. Jugendverantwortung folgt `canAccessYouthAll` sowie den bestehenden technischen Kompatibilitätskeys `jugendleiter`/`jugendkoordinator`. Anzeigenamen und Clientzustand werden nicht ausgewertet.

## 5. Superadmin

Der bestehende globale Bypass erlaubt die serverseitige Count-Abfrage. Mit globalem Scope ist auch `/admin/settings` erreichbar.

## 6. Vorstand

Vorstand benötigt weiterhin den bestehenden spezifischen View-Key. B15.5A fügt keine Edit- oder Forward-Rechte hinzu.

## 7. Jugendleiter/Jugendkoordinator

`youth_all` ist die primäre bestehende Scope-Metadatenquelle. `jugendkoordinator` bleibt lediglich ein zentraler Kompatibilitätsfall, da er nicht zur kanonischen Rollenliste gehört. Fehlt `settings.view`, erscheint der aggregierte Hinweis ohne Link statt mit einem möglichen 403-Ziel.

## 8. Kassierer

Die breiten Bestandskeys `settings.view` und `membership_requests.view` reichen ausdrücklich nicht aus. Ohne freigegebenen Board-/Youth-Kontext bleibt die Membership-Query aus. Contribution-Query, -Notices und -Zusammenfassung bleiben unverändert.

## 9. Trainer/Betreuer/Gast

Team-, Staff- oder Read-only-Scope allein gewähren keinen Zugriff. Es werden keine Membership-Daten geladen und keine leeren Platzhalter erzeugt.

## 10. Query-Gating

Die Policy wird im reinen Queryplan vor `loadMembershipCount` ausgewertet. Bei `false` wird der Repository-Aufruf durch den bedingten Promise-Zweig vollständig übersprungen und der interne Count bleibt null beziehungsweise lokal nullwertig.

## 11. Dashboard-DTO

Bei Freigabe und positivem Count enthält die Notice nur `key`, `tone`, aggregierten `count`, Text und optional `/admin/settings`. Sie enthält keine Antrag-ID, Namen, E-Mail, Teamzuordnung, Notizen oder sonstige Antragstellerdaten. Bei fehlender Freigabe existiert kein Membership-Notice-Objekt.

## 12. Zukünftige Rollen

Weitere Rollen werden künftig ausschließlich in der zentralen serverseitigen Policy anhand bestehender Permission-/Scope-Metadaten ergänzt. UI-Komponenten enthalten keine Rollenlisten.

## 13. Notification-TODO

Deferred bleiben der vollständige rollenübergreifende Notice-Audit, eine zentrale Notification-/Notice-Policy, spätere Rollen, Glocken-Empfängerabgleich sowie Gelesenstatus und Persistenz. B15.5A implementiert davon nichts.

## 14. Tests

Tests decken Superadmin, Vorstand, Jugendleiter, Jugendkoordinator-Kompatibilität, Kassierer, Trainer, Betreuer und Gast sowie Query-Gating, Null-/Positivcount, optionalen sicheren Link, DTO-Datensparsamkeit und Contribution-Regression ab. Dashboard- und Navigationstests laufen zusätzlich.

## 15. Offene Risiken

Die Settings-Seite selbst lädt Mitgliedsanfragen weiterhin unter ihrem breiten Seiten-Guard; B15.5A ändert auftragsgemäß ausschließlich das Dashboard. Der nicht kanonische Jugendkoordinator-Key sollte in einem späteren Rollen-Audit bereinigt werden.

## 16. Empfohlener nächster Schritt

Separat den Settings-Tab und seine Page-Queries auf `membership_requests.view` plus fachliche Scope-Policy prüfen und anschließend eine gemeinsame Notice-Empfängerpolicy für Dashboard und künftige Glocke entwerfen.
