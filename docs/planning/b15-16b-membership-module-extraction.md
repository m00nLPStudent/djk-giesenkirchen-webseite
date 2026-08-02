# B15.16B – Membership-Modul extrahieren

## 1. Ziel

Mitgliedsanfragen, Empfänger und Weiterleitung bilden ein eigenständiges Adminmodul unter `/admin/membership-requests`. Datenmodell und bestehende Schreiblogik bleiben unverändert.

## 2. Ausgangslage

`/admin/settings` lud unter dem breiten Guard `settings.view` gleichzeitig Settings-, Membership-, Coach- und Vorstandsdatensätze. Dadurch konnten Rollen mit Settings-Zugriff Membership-Daten abfragen, obwohl B15.5A sie vom Dashboard ausschloss.

## 3. Bisheriger Settings-Datenpfad

Der Settings-Loader enthielt Queries für `membership_requests`, `membership_request_recipients`, Coaches und Vorstandsmitglieder. `AdminSettingsEditor` hielt Membership-Zustände und renderte den Tab „Mitglied werden“. Diese Pfade wurden vollständig entfernt; Settings lädt nur noch Vereinsdaten, Kontakte und Seiten.

## 4. Zentrale Membership-Policy

`canAccessMembershipRequests` in `src/lib/admin-auth/membershipAccess.js` entscheidet anhand technischer Rollen-Keys, vorhandener Permission-Keys und bereits vorhandener Scope-Metadaten. Erlaubt sind Superadmin, Vorstand mit `membership_requests.view`, Jugendleiter und der Jugendkoordinator-Kompatibilitätsfall. Kassierer, Trainer, Betreuer, Gast und unbekannte Kontexte sind gesperrt. Dashboard, Navigation und Membership-Loader verwenden dieselbe Policy.

## 5. Neue Route

Die neue dynamische Route `/admin/membership-requests` ruft einen eigenen serverseitigen Loader auf. Nach Authentifizierung wird die zentrale Policy geprüft, bevor eine Membership-, Empfänger-, Coach- oder Board-Query entsteht. Bei Ablehnung folgt ein Redirect auf die projektübliche Unauthorized-Seite. Das Page-DTO wird explizit serialisiert.

## 6. Settings-Entkopplung

Settings enthält nur Vereinsdaten einschließlich Farben/Social Links, allgemeine Kontakte und Seiten/CMS. Membership-Props, Zustände, Imports, Queries und Fehlerbereiche wurden entfernt. Bestehende Settings-Handler enthalten keine Membership-Handler mehr.

## 7. Navigation

Der bisher geplante Eintrag unter Gesamtverein ist aktiv und verweist auf `/admin/membership-requests`. Der Resolver wertet dafür die zentrale Membership-Policy aus. Nicht erlaubte Rollen erhalten weder Link noch leere Section.

## 8. Dashboard-Link

Die bestehende B15.5A-Count-Query bleibt unverändert gegatet. Nur der optionale sichere Ziel-Link wurde auf `/admin/membership-requests` umgestellt. Das Notice-DTO enthält weiterhin ausschließlich aggregierten Count und UI-Metadaten.

## 9. Anfragenliste

Die Liste nutzt das gemeinsame responsive Listenmuster: Tabelle ab `xl`, vollständig klickbare Karten darunter, Empty State und Chevron. Angezeigt werden nur Name, Mannschaft/Jahrgang, Eingang, Status und Weiterleitungsstatus. E-Mail und Telefon erscheinen nicht in der Übersicht.

## 10. Detailansicht

Der bestehende Editor bleibt fachlich erhalten. Personen-, Kontakt-, Mannschafts- und Eingangsdaten werden in einer gemeinsamen Information Section angezeigt. Status, Nachricht, interne Notiz und vorhandene Aktionen bleiben an ihre bestehenden Permission-Gates gebunden.

## 11. Empfänger

Die vorhandene Empfängerverwaltung verwendet unverändert dieselben Formzustände, Validierung und Servicefunktionen. Die Auswahl ist als Desktopliste beziehungsweise mobile Karten umgesetzt; Status und Anfrageart bleiben sichtbar.

## 12. Weiterleitung

Zieltyp, Zielperson, Notiz, vorhandener Status sowie Erfolgs- und Fehlermeldungen verwenden unverändert die vorhandenen Handler und Services. Es wurde kein Mailversand oder automatischer Workflow ergänzt.

## 13. Permissions

Verwendet werden ausschließlich bestehende Keys: `membership_requests.view`, `membership_requests.edit` und `membership_requests.forward`. Der Route-Transport wird zunächst über den vorhandenen Admin-Basiszugang erreicht; der Seitenloader setzt anschließend die strengere zentrale Policy durch. Rollenbelegungen wurden nicht geändert.

## 14. Scopes

Verwendet werden nur bestehende Metadaten: global/Superadmin, Vorstand plus View-Key, `youth_all`, Jugendleiter und Jugendkoordinator-Kompatibilität. Team-Scope gewährt keinen Membership-Zugriff. Die Scope-Engine wurde nicht verändert.

## 15. Query-Gating

Der Policy-Check liegt vor `Promise.all` und vor allen Domainqueries. Tests prüfen Reihenfolge und Dependency-Injection-Gate. Bei Kassierer, Trainer oder unbekanntem Kontext wird der Loader nicht aufgerufen.

## 16. Datenschutz

Navigation und Dashboard enthalten keine Antragstellerdaten. Die Übersicht zeigt keine Mailadresse, Telefonnummer oder interne Notiz. Vollständige Daten werden erst nach serverseitigem Guard im Detailbereich ausgeliefert. Redirect-Gründe enthalten keine IDs oder Kontaktdaten.

## 17. Responsive

Listen wechseln ab `xl` auf Desktopdarstellung. Darunter werden Karten ohne verschachtelte Interaktionen verwendet. Lange Texte und Mailadressen brechen; gemeinsame Buttons haben mindestens 44 Pixel Höhe. Es gibt keine horizontalen Scrollcontainer.

## 18. Accessibility

Tabs besitzen `role=tab`, `aria-selected` und semantische Buttons. Filter verwenden das gemeinsame Disclosure mit `aria-expanded`/`aria-controls`. Listenzeilen und Karten sind echte Buttons, Status enthält Textlabels, Focus-Ringe stammen aus dem Designsystem.

## 19. Tests

Policy-, Query-Gating-, Settings-Entkopplungs-, Modul-, Dashboard- und Navigationstests wurden ergänzt beziehungsweise aktualisiert. Gezielt werden alle geforderten Rollenfälle, der neue Link, serialisierbares DTO und das Fehlen alter Settings-Pfade geprüft.

## 20. Risiken

Die bestehenden Membership-Schreibservices bleiben clientseitige Supabase-Aufrufe und stützen sich weiterhin auf die vorhandenen RLS-/Permission-Grenzen; dies wurde auftragsgemäß nicht verändert. Eine Bereinigung der im Seed dokumentierten Kassierer-Permissions bleibt B15.16C vorbehalten. Eine authentifizierte visuelle Browserprüfung benötigt geeignete Testkonten.

## 21. Empfohlener nächster Schritt

B15.16C soll `settings.view` von Vereinsstruktur und Membership vollständig entkoppeln, den Live-Rollenbestand prüfen und Settings anschließend auf Superadmin/Webmaster begrenzen.
