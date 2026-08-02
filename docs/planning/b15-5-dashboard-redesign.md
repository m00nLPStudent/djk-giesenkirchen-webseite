# B15.5 – Dashboard-Redesign

## 1. Ziel

`/admin` ist eine kompakte, persönliche Arbeitsübersicht statt einer Sammlung großer Statistik-Karten.

## 2. Ausgangslage

Die alte Route führte globale Counts und Inhaltsabfragen unabhängig von der tatsächlichen Berechtigung aus. `DashboardStatGrid`, Quick-Action-Konfiguration und mehrere große Panels duplizierten Zugriffsentscheidungen und verbrauchten viel vertikalen Raum.

## 3. Begrüßung

Die Begrüßung wird für `Europe/Berlin` aus der aktuellen Stunde als „Guten Morgen“, „Guten Tag“ oder „Guten Abend“ erzeugt. Ein Name wird nur angehängt, wenn ein belastbarer Profilwert existiert.

## 4. Intro-Logik

Der Introtext folgt globalem, Youth- oder Team-Scope und bestehenden Modulpermissions. Rollenbezeichnungen sind nicht Teil der Entscheidung. Finanz-, Vereins-, Jugend- und Teamkontexte erhalten dadurch passende Texte ohne zweite Rollenmatrix.

## 5. Dashboard-DTO

Das serialisierbare DTO enthält ausschließlich Begrüßung, Notices, Schnelllinks, Termine, News, eine optionale Contribution-Zusammenfassung, relevante aktuelle Einträge und den Erstellungszeitpunkt. Funktionen, Clients, Secrets, Scope-IDs, Zahlungshistorien und interne Gründe werden nicht übertragen.

## 6. Server-Loader

`dashboard.loader.js` ist durch `server-only` geschützt und request-lokal mit React `cache()` dedupliziert. Ein Authkontext und ein Scopekontext speisen sowohl den bestehenden Navigationsresolver als auch den Dashboard-Queryplan. `AdminLayout` erhält dieses Navigation-DTO, sodass die Dashboardroute keine zweite Navigations-Authabfrage auslöst.

## 7. Hinweise/Aufgaben

Notices entstehen nur aus tatsächlich geladenen Counts: überfällige beziehungsweise offene Beitragsfälle und gemäß B15.5A sicher freigegebene Mitgliedsanfragen. Ohne positive Werte erscheint der kompakte Zustand „Aktuell liegen keine dringenden Aufgaben vor.“ Es gibt keine persistente Task- oder Notification-Logik.

## 8. Vereinsbeiträge

Contribution-Daten werden ausschließlich mit `contributions.view` geladen. Das DTO enthält offene, teilweise bezahlte und überfällige Fallzahlen sowie den offenen Gesamtbetrag, aber keine Zahlungseinträge oder internen Gründe. Ohne direkte Permission wird weder geladen noch gerendert; scoped Status bleibt in den bestehenden Mannschafts-/Spieleransichten.

## 9. Termine

Mit `events.view` werden maximal fünf veröffentlichte zukünftige Termine geladen. Datum, Uhrzeit, Titel und Ort werden kompakt angezeigt. `events.edit` erlaubt den Editlink; andernfalls führt der Eintrag nur zur erreichbaren Übersicht.

## 10. News

Mit `news.view` werden maximal fünf zuletzt erstellte News geladen. Titel und Veröffentlichungsstatus erscheinen ohne Vorschaubilder. Detailbearbeitung wird nur mit `news.edit` verlinkt, sonst die Übersicht.

## 11. Schnellnavigation

Bis zu acht aktive Links werden unmittelbar aus dem permission- und scope-gefilterten B15.2-Dashboard-Navigation-DTO abgeleitet. Es existiert keine zusätzliche Quicklink-Konfiguration; planned Items und `/admin` selbst werden ausgeschlossen.

## 12. Zuletzt bearbeitet

Der Bereich kombiniert ausschließlich die ohnehin geladenen News und Termine anhand vorhandener Zeitstempel. Er erzeugt keine Zusatzquery. Teams, Spieler, Trainer, Contributions und CMS-Seiten bleiben für eine fachlich sichere gemeinsame Activity-Quelle `DEFERRED`.

## 13. Permission-/Scope-Verhalten

Jede Domainquery wird durch den Queryplan mit dem bestehenden `*.view`-Key aktiviert. Navigation und Intros verwenden denselben Scope. Es werden keine neuen Permissions, Rollenfreigaben oder Scopes eingeführt und keine Mutationsrechte aus Leserechten abgeleitet.

## 14. Query-Strategie

Auth wird einmal vollständig aufgelöst; Scope benötigt die bestehenden Profilverknüpfungsabfragen. Navigation selbst benötigt danach keine Query. Zusätzlich erfolgt eine kleine Namensabfrage. Domainqueries laufen parallel und nur bei Freigabe: höchstens eine Event-, eine News- und – nach zentraler B15.5A-Policy – eine Membership-Count-Abfrage; Contribution verwendet den bestehenden Statistikservice. Teamqueries sind in B15.5 immer null.

## 15. Layout

Nach Begrüßung und breiter Hinweisleiste folgt auf `xl` ein Hauptgrid: Termine und News links, Schnellnavigation, Contributions und relevante Einträge rechts. Flache Panels, Linien, kleine Icons und kompakte Zeilen ersetzen große Zahlenkarten.

## 16. Responsive

Unter `xl` stapeln alle Inhalte einspaltig. `min-w-0`, umbrechende Texte und der Verzicht auf Tabellen verhindern horizontales Scrollen bei 1180, 1024, 900, 768, 430 und 375 px. Interaktive Zeilen sind mindestens 44 px hoch.

## 17. Leerzustände

Keine Notices ergeben einen positiven Gesamtzustand. Termine und News werden ohne Berechtigung oder Daten nicht als leere Einzelpanels gerendert; fehlen beide, erscheint ein gemeinsamer ruhiger Hinweis. Quicklinks, Contributions und aktuelle Einträge fehlen vollständig, wenn keine Daten vorliegen.

## 18. Tests

Pure Tests prüfen Zeitgrenzen, Namensfallbacks, fünf permission-/scope-basierte Intros, Query-Gating, Notices, leere Zustände, Quicklinks, planned-Ausschluss, Recent Items, DTO-Sicherheit und kompakte responsive Struktur. Alle B15.2–B15.4-Navigationstests laufen als Regression mit.

## 19. Risiken

Der Contribution-Statistikservice lädt für seine bestehenden Berechnungen mehr Daten als die listenbasierten Dashboardqueries. Ein echtes Activity-Log fehlt. Browserabnahme mit authentifizierten Rollen sowie visuelle Prüfung der realen Datenlängen bleiben erforderlich.

## 20. Empfohlener nächster Schritt

Nach Staging-Abnahme kann eine getrennte Phase den Contribution-Statistikservice durch serverseitige Aggregate optimieren und später eine sichere, gemeinsame Activity-/Notice-Quelle für Dashboard und Glocke entwerfen.
