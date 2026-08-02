# B15.16A – Settings- und Stammdaten-Neustrukturierung

## 1. Ziel

Dieser Schritt dokumentiert Bestand und Zielbild. Er verändert weder Anwendung noch Datenbank. Der beiliegende SQL-Preflight besteht ausschließlich aus lesenden Abfragen und wurde nicht ausgeführt.

## 2. Aktuelle Settings-Struktur

`/admin/settings` lädt unter einem einzigen serverseitigen Guard `settings.view` parallel `club_settings`, `club_contacts`, `pages`, `membership_request_recipients`, `membership_requests`, Coaches und Vorstandsmitglieder. Die UI besitzt die Tabs Vereinsdaten, Kontakte, Mitglied werden und Seiten. Mitglied werden enthält Empfänger und Anfragen. Dadurch führt bereits der breite Settings-Zugriff zur vollständigen Membership-Abfrage.

## 3. Neue Settings-Struktur

In Einstellungen verbleiben Vereinsdaten einschließlich Farben und Social Links, allgemeine Kontakte, Seiten/CMS und ein neuer Bereich Stammdaten. Stammdaten gliedern sich fachlich in Mannschaftsvorlagen, News-Kategorien, Termin-Kategorien und Download-Kategorien. Es werden keine künstlichen Summary- oder Filterwerte benötigt.

## 4. Mitgliedsanfragen als eigenes Modul

Anfragen, Empfänger und Weiterleitung wechseln fachlich nach Gesamtverein → Mitgliedsanfragen. Empfohlene Route ist `/admin/membership-requests`, weil sie keinen fachfremden Settings-Queryverbund laden darf. B15.5A bleibt die Empfängerpolicy für Dashboard-Counts: Superadmin, berechtigter Vorstand und Jugendverantwortung; Kassierer, Trainer, Betreuer und Gast lösen keine Query aus. Der neue Seitenloader muss dieselbe serverseitige Policy vor allen Anfragen-, Empfänger-, Coach- und Vorstand-Queries anwenden. Ein eigener Permission-Key existiert bereits; ein neuer Key ist nicht erforderlich, seine derzeitige Rollenzuordnung ist aber zu korrigieren.

## 5. Aktuelle Permission-/Scope-Lage

Route und Page-Loader von `/admin/settings` verlangen `settings.view`. Navigationseinträge für Settings und Vereinsstruktur verwenden ebenfalls `settings.view`; `/admin/department`, Board-Edit und Teile der Board-Actions hängen daran. Der dokumentierte Seed vergibt `settings.view` an Superadmin, Vorstand, Kassierer und Webmaster. Ein separates Proposal nennt zusätzlich Fußball-Vorstand und Jugendleiter; der reale Datenbankstand muss mit dem Preflight bestätigt werden. Membership-UI verwendet `membership_requests.edit` und `.forward`, die Page-Abfrage selbst wird jedoch nur durch `settings.view` geschützt. Das ist der zentrale Entkopplungsbedarf.

## 6. Superadmin/Webmaster-Ziel

`webmaster` existiert im Seed als aktive technische Rolle. `settings.view` und `settings.edit` existieren und sind dieser Rolle sowie Superadmin zugeordnet. Ziel: nur diese beiden Rollen erhalten Settings-Zugriff. Eine reine Rollenprüfung sollte vermieden werden; bevorzugt bleibt der Permission-Guard, nachdem die Rollenzuordnungen bereinigt und Vereinsstruktur fachlich von `settings.view` entkoppelt wurden. Vorher ist die Einschränkung No-Go, weil sie Vorstand/Abteilungsverwaltung und den bisherigen Membership-Ziel-Link beschädigen würde.

## 7. Mannschaftsstammdaten

`team_templates` ist bereits ein dynamisches Stammdatenmodell mit `id`, `name_de`, `slug`, `age_group`, `is_active`, `sort_order` und eindeutigem Slug. Beim Erstellen werden ausschließlich aktive Templates geladen; Name, Slug und Altersgruppe werden daraus übernommen und danach im Teamformular gesperrt. `teams` bildet die Identität, `team_seasons` den saisonalen Snapshot; `departments` ordnet den Bereich zu.

„D2“ ist nach aktuellem Code eine konkrete Mannschaftsvorlage beziehungsweise Mannschaftsidentität, nicht eine Kombination aus separater Altersklasse und Nummer. Es gibt kein Feld `team_number`; `name_de`, `slug` und `age_group` werden gemeinsam aus `team_templates` übernommen. Fehlt D2 in der Auswahl, fehlt sehr wahrscheinlich der aktive Template-Datensatz oder er wird durch Youth-Scope-Filterung ausgeschlossen. Vor Umsetzung ist der reale Template-Bestand zu prüfen. Empfohlen wird, `team_templates` zu härten statt ein paralleles Modell einzuführen: optional `updated_at`, fachlich eindeutiger normalisierter Name, unveränderlicher Slug/Key nach Verwendung und Nutzungsprüfung gegen `teams`/`team_seasons`. Verwendete Templates nur deaktivieren.

## 8. News-Kategorien

Kategorien sind derzeit ein statisches Array in `NewsCategoryFields.js`. Gespeichert werden freies Label `news.category` und optionaler Text-Key `news.category_key`; eine Kategorietabelle oder ein dokumentierter Check-Constraint existiert nicht. Aktuelle Codewerte: allgemein, verein, fussball, tischtennis, damen-gymnastik, testessen und sonstiges. Öffentliche und Admin-Darstellung lesen diese Felder. Ziel ist `news_categories(id, key, name_de, description, sort_order, is_active, created_at, updated_at)` mit eindeutigem unveränderlichem Key. Bestehende Werte müssen vor FK-Einführung inventarisiert und gemappt werden. Farbe ist optional und derzeit ohne Verbraucher; Slug neben Key ist unnötig, solange beide dieselbe technische Identität hätten.

## 9. Termin-Kategorien

`events.event_type` ist Text mit Datenbank-Check und statischer UI-Liste: vereinstermin, training, spiel, turnier, sonstiges. Virtuelle Mannschaftstrainings setzen zwingend `event_type: "training"` und `source_type: "team_training"`. `training` ist deshalb ein geschützter System-Key. Auch `vereinstermin` dient als Default. Ziel: technische Keys und bearbeitbare Labels trennen. Systemtypen bleiben unveränderlich, aktiv und nicht löschbar; höchstens zusätzliche fachliche Kategorien dürfen administrierbar sein. Vor einer FK-Umstellung müssen Check-Constraint, virtuelle Erzeugung, öffentliche Filter und Bestandswerte gemeinsam migriert werden.

## 10. Download-Kategorien

Ein eigenständiges Download-Modell existiert nicht. Vorhanden sind nur fachgebundene `news_documents`, `event_documents` und die Storage-Buckets `news-documents`/`events-documents`. Diese sind kein allgemeines Download-CMS. Für eine spätere Kategorieverwaltung eignet sich `download_categories(id, key, name_de, description, sort_order, is_active, created_at, updated_at)`. Eine FK zu einem künftigen Download-Datensatz wird erst zusammen mit dem Download-Modul geplant; Upload, Storage und öffentliche Ausgabe bleiben deferred.

## 11. Kategorienmodell-Entscheidung

Empfohlen ist Variante A mit fachlich getrennten Tabellen. News-, Event-, Download- und Mannschaftsdaten besitzen unterschiedliche Lebenszyklen, System-Keys, Referenzen und Löschregeln. Eine polymorphe `content_categories`-Tabelle könnte keine normalen fachlichen Fremdschlüssel erzwingen, verkompliziert RLS und erlaubt ungültige Domain-/Key-Kombinationen. `team_templates` soll als vorhandene eigene Tabelle weiterverwendet werden.

## 12. Deaktivierungs- und Löschregeln

- Technische Keys nach erster Verwendung unveränderlich.
- Normalisierte Keys und gegebenenfalls Namen pro Tabelle eindeutig.
- Neue Zuordnungen zeigen nur aktive Werte.
- Bestehende Datensätze dürfen deaktivierte Werte weiter anzeigen.
- Verwendete Einträge niemals hart löschen.
- Unbenutzte Einträge nur nach serverseitiger Nutzungsprüfung löschbar; bevorzugt auch dann deaktivieren.
- `training` und weitere Systemtypen weder deaktivierbar noch löschbar.
- `team_templates` mit abgeleiteten Teams nur deaktivieren.

## 13. Navigation

Gesamtverein erhält später den aktiven Eintrag Mitgliedsanfragen → `/admin/membership-requests`. Settings bleibt `/admin/settings` und enthält Vereinsdaten, Kontakte, Seiten und Stammdaten. Der bestehende geplante Navigationseintrag kann aktiviert werden, sobald Route, Guard und Tests vorhanden sind. Dashboard-Notices müssen danach auf die neue Route zeigen. In B15.16A erfolgt keine Navigationsänderung.

## 14. Designziel

Settings erhält kompakte Subnavigation und gruppierte Formulare. Kontakte und Seiten bleiben Liste/Editor; Stammdaten nutzen Desktop-Tabellen ab `xl` und mobile Karten. Mitgliedsanfragen werden ein eigenes Modul mit Header, vorhandenen Statuswerten, Filtern, Liste, Detail und Empfänger-Unterbereich. Gefahraktionen bleiben unten. Keine UI wird in dieser Phase umgesetzt.

## 15. Datenbankauswirkungen

Additiv benötigt werden voraussichtlich `news_categories`, `event_categories` und `download_categories`; `team_templates` wird nur gehärtet. Spätere Schritte umfassen Bestandswert-Inventur, Seed der vorhandenen Keys, nullable Kategorie-FKs, Backfill, Validierung, danach geeignete NOT-NULL-/FK-/Unique-Constraints und Indizes. Event-Systemtypen benötigen ein Schutzmerkmal wie `is_system` sowie serverseitigen Änderungs-/Löschschutz. RLS und Grants sind je Fachdomäne separat zu entwerfen. B15.16A führt nichts davon aus.

## 16. Go-/No-Go-Kriterien

Go erst bei bestätigtem Live-Inventar, vollständigem Mapping ohne unbekannte Werte, geklärter Ownership für Labels, getesteter B15.5A-Policy auf der neuen Route, entkoppelter Vereinsstruktur-Permission, Rollback-/Backfillplan und Regressionen für virtuelle Trainings. No-Go bei unbekannten Kategoriekeys, mehreren konkurrierenden Templates, unklaren RLS-Policies, client-only Membership-Schutz oder fehlendem Schutz technischer Eventtypen.

## 17. Risiken

Größtes Datenschutzrisiko ist der aktuelle breite Settings-Loader. Weitere Risiken sind bestehende freie Newswerte, doppelte Teamtemplates, historische Referenzen ohne FK, Übersetzungs-/Key-Drift, die Kopplung von Vereinsstruktur an `settings.view` und Beschädigung virtueller Trainings durch editierbare Systemtypen. Der dokumentierte Seed ist nicht zwingend identisch mit dem Live-Stand.

## 18. Empfohlene Teilphasen

1. B15.16B: Membership-Modul samt serverseitiger B15.5A-Policy und Navigation herauslösen.
2. B15.16C: Vereinsstruktur entkoppeln, Live-Rollenbelegung prüfen, Settings auf Superadmin/Webmaster begrenzen.
3. B15.16D: Vereinsdaten, Farben, Social Links und Kontakte verdichten.
4. B15.16E: Seiten/CMS kompakt gestalten.
5. B15.16F: `team_templates` administrierbar machen und härten.
6. B15.16G: News-Kategorien additiv einführen und backfillen.
7. B15.16H: Event-Kategorien mit geschützten Systemtypen einführen.
8. B15.16I: Download-Kategorien vorbereiten; Download-Modul separat planen.
