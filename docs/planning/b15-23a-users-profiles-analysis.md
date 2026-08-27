# B15.23A – Benutzer & Profile: Bestandsanalyse und Zielarchitektur

## Status und Grenzen

B15.23A ist als Analyseblock abgeschlossen, ohne Implementierung. Repository-Stand untersucht; Live-Fakten werden mit `../sql/b15-23a-users-profiles-preflight-readonly.sql` ausschließlich aggregiert und read-only erhoben. Keine Personendaten, Auth-Benutzer, Rollen, Medien, RLS oder Daten wurden verändert.

**Nachfolgende verbindliche Fachentscheidung:** Die in dieser Analyse ursprünglich als Entscheidungsvorlage erwogene allgemeine `persons`-Tabelle und umfassende Personenmigration werden nicht weiterverfolgt. Das bestehende Modell aus Auth-/Adminprofil-Identität, Rollen/Permissions sowie expliziten nullable Trainer-/Vorstandslinks bleibt bestehen. Maßgeblich für die weitere Roadmap sind B15.23B (Security-Hardening der vorhandenen Strukturen) und B15.23C (ausschließlich Erweiterung des Dashboardprofils).

## Ist-Modell

### Auth, Adminprofil und Rollen

- Supabase `auth.users` hält Login-Identität, Login-E-Mail, Passwort/Recovery und Session.
- `admin_profiles` ist die öffentliche Anwendungsspiegelung eines Dashboard-Kontos mit mindestens `id`, `full_name`, `email`, `is_active`, Zeitstempeln und `last_login_at`.
- Der reguläre Einladungsflow erzeugt zuerst über die server-only Service Role einen Auth-Benutzer und anschließend `admin_profiles` mit derselben UUID. Rollenlinks verwenden `admin_user_roles.user_id = admin_profiles.id`; Rollen und Permissions kommen aus `admin_roles`, `admin_user_roles`, `admin_role_permissions` und `admin_permissions`.
- Der Session-Lookup sucht zuerst strikt `admin_profiles.id = auth.users.id`, fällt bei fehlender ID-Zeile aber auf normalisierte E-Mail zurück. Zahlreiche historische RLS-Policies akzeptieren ebenfalls ID **oder** E-Mail aus dem JWT. Die ID ist Ziel- und Rollenidentität; E-Mail ist jedoch noch ein sicherheitsrelevanter Kompatibilitätsweg.
- Im Benutzereditor ist die E-Mail bestehender Profile read-only. Der Create-Flow verlangt E-Mail-Eindeutigkeit in `admin_profiles`, versendet eine Auth-Einladung und kompensiert bei nachfolgenden Fehlern. Das eigene Profil ändert nur `full_name`; Passwortänderung und Recovery laufen direkt gegen Auth.

### Trainer, Vorstand und Kontakte

- `coaches` besitzt eigene Person-/Fachdaten: `first_name`, `last_name`, Legacy-`name`, `email`, `phone`, `whatsapp`, Lizenz, Nationalität, Aktivstatus, Rollen-/Saisondaten, Bildfelder und nullable `admin_profile_id`.
- `board_members` besitzt eigene Person-/Fachdaten: `first_name`, `last_name`, `email`, `phone`, Amt/Rolle, Aktivstatus, Sortierung, Bildfelder und nullable `admin_profile_id`.
- Beide `admin_profile_id`-Spalten referenzieren `admin_profiles.id` mit `ON DELETE SET NULL`; die vorbereitete/als umgesetzt markierte Migration enthält je Entität einen partiellen Unique-Index. Der Live-Preflight muss tatsächliche FKs und Eindeutigkeit bestätigen.
- Die Benutzerverwaltung kann als Superadmin Trainer- und Vorstandskarten explizit zuordnen oder lösen. Normalisierte E-Mail und Name dienen nur als Vorschlag/Match-Hilfe, nicht als dauerhafte Autorisierung.
- `club_contacts` ist eine weitere fachliche Kontaktdatenquelle mit eigenen Namen, E-Mail, Telefon und eigenem Bild; eine Verbindung zu `admin_profiles` ist im Anwendungscode nicht nachgewiesen.

### Kann dieselbe reale Person erkannt werden?

Teilweise. Ein Adminprofil kann heute explizit mit höchstens einer Trainerkarte und einer Vorstandskarte verbunden sein. Sind beide FKs auf dieselbe `admin_profiles.id` gesetzt, ist `Admin = Trainer = Vorstand` technisch erkennbar. Nicht verknüpfte Datensätze bleiben eigenständig; E-Mail-Matches sind nur Hinweise. Es gibt keine allgemeine Personen-ID, die auch Personen ohne Dashboardkonto oder weitere Funktionsprofile zusammenführt.

## Source-of-Truth- und Dublettenmatrix

| Datenfeld | Auth | Adminprofil | Trainer | Vorstand | Sonstige | Heutige Einordnung |
|---|---|---|---|---|---|---|
| Vorname/Nachname | ggf. Metadaten, nicht fachlich genutzt | nur `full_name` | eigene Felder | eigene Felder | Kontakte/Spieler eigene Felder | dupliziert; keine zentrale Source of Truth |
| E-Mail | Login/Recovery | Rollen-, Notification- und Delivery-Adresse | fachlicher/öffentlicher Trainerkontakt | fachlicher/öffentlicher Vorstandskontakt | Kontakte und Membership-Empfänger | Auth ist Login-Source; `admin_profiles.email` ist operative Dashboard-Mail-Source; fachliche Kontaktmails sind separat |
| Telefon | – | nicht nachgewiesen | `phone`, `whatsapp` | `phone` | Kontaktfelder | funktionsbezogen/öffentlich |
| Profilbild | – | keines nachgewiesen | eigenes zentrales Trainerbild | eigenes zentrales Vorstandsbild | Kontaktbilder | funktionsbezogen; kein Dashboardbild vorhanden |
| Anzeigename | Auth-Metadaten nicht maßgeblich | `full_name`, kein Nickname | Legacy-`name` plus Vor-/Nachname | aus Vor-/Nachname | entitätsspezifisch | dupliziert; kein separater Dashboard-Nickname |
| Funktion | – | Rollenlinks | Trainerrollen und saisonale Zuweisungen | Amt/Vorstandsrolle | Kontaktfunktion | zwingend funktionsbezogen |
| Benutzerstatus | Auth-Zustand | `is_active` als Admin-Gate | `is_active` | `is_active` | eigene Status | mehrere fachlich verschiedene Status |

## E-Mail-Flüsse und Risiken

- Login verwendet `auth.users.email`.
- Recovery verwendet bevorzugt Session-`user.email`, ersatzweise `admin_profiles.email`.
- Einladungen verwenden dieselbe E-Mail für Auth und neues Adminprofil.
- Notification-E-Mail-Delivery lädt die Empfängeradresse ausdrücklich aus `admin_profiles.email`; Notification-Ownership verwendet die Auth-/Profil-UUID.
- Membership-Zuständigkeiten und interne Notifications werden aus aktiven Adminprofilen, Rollen und Permissions nach Profil-ID aufgelöst. Manuelle fachliche Weiterleitungsziele können dagegen Coach-/Board-/Recipient-Kontaktadressen verwenden.
- Trainer-, Vorstand- und Kontakt-E-Mails sind fachliche Kontaktadressen und dürfen von der Login-Adresse abweichen.
- Der aktuelle ID-oder-E-Mail-Fallback in Lookup und RLS kann bei auseinanderlaufenden oder wiederverwendeten E-Mails Identitäten falsch zuordnen. Eine spätere E-Mail-Änderung darf deshalb nicht als einfache Mehrtabellen-Aktualisierung umgesetzt werden.

Aktuell gibt es keine einzige universelle E-Mail-Source of Truth. Es existieren mindestens zwei legitime Zwecke:

1. Account-/Login-/Recovery-E-Mail: Auth.
2. Öffentliche beziehungsweise funktionsbezogene Kontakt-E-Mail: Trainer, Vorstand oder Kontakt.

Für Dashboard-Notifications ist derzeit `admin_profiles.email` die operative Adresse. Ob diese dauerhaft eine bewusst getrennte Notification-Adresse oder nur ein Auth-Spiegel sein soll, ist vor Migration fachlich zu entscheiden.

## Medienbibliothek

- Trainer und Vorstand besitzen getrennte `image_media_asset_id`-Referenzen und getrennte Usages (`coach/image`, `board_member/image`). Damit kann dieselbe Person bereits unterschiedliche Funktionsbilder verwenden.
- Upload, Assignment-RPC und Archivschutz laufen über `media_assets`, `media_asset_usages` und `synchronize_media_assignment`; es gibt keine zweite Bildarchitektur.
- Ein Dashboard-Profilbild ist derzeit weder als Feld noch als Assignment-Ziel nachgewiesen.
- Ein späteres Dashboardbild sollte als eigener zentraler Media-Verwendungszweck und eigene Usage des Dashboard-/Personenprofils ergänzt werden. Es darf Trainer-/Vorstandsbilder weder überschreiben noch daraus abgeleitet werden.

## Security-Iststand

- Adminzugang verlangt Auth-Session plus vorhandenes aktives Adminprofil.
- Rollen/Permissions werden über Profil-ID ausgewertet; Superadmin-Verwaltung schützt Benutzer- und Kartenlinks serverseitig, während Profil-Self-Service nur den eigenen Namen über eine Own-row-RLS-Policy schreiben soll.
- Passwortänderung ist Auth-Self-Service. Eine eigene E-Mail-Änderungsfunktion ist nicht implementiert.
- Trainer-/Vorstandsmutationen besitzen eigene Permissions und serverseitige Guards; ein normales Profil kann nicht allein durch die Kartenverknüpfung diese Fachdaten ändern.
- Service Role wird unter anderem für Auth-Einladung/Cleanup, gehärtete Adminpfade, Notification-Mail-Delivery und Membership-Zugriffe server-only verwendet.
- Hauptrisiken einer Zentralisierung: Accountübernahme durch falsche E-Mail-Synchronisierung, Aufbrechen von RLS-Fallbacks, falsche Rollen-/Notification-Empfänger, unbeabsichtigtes Überschreiben öffentlicher Kontaktdaten, Bild-/Usage-Verlust, Dubletten-Merge nach Namen und Verlust funktionsbezogener Historie.

## Historische Zielarchitektur-Option (verworfen)

1. Eine stabile zentrale `persons`-Identität für reale Personen einführen, unabhängig davon, ob ein Login existiert. Keine Zuordnung durch Namensvergleich.
2. `admin_profiles` als Account-/Dashboardprofil an genau eine Person binden; Auth-UUID bleibt Account-Schlüssel. Login-E-Mail bleibt Auth-Verantwortung.
3. `coaches`, `board_members` und bei nachgewiesenem Bedarf `club_contacts` über nullable explizite `person_id` an dieselbe Person binden. Funktionsdaten, Status, Amt, Lizenz, Teamrollen, öffentliche Kontaktadresse und Bilder bleiben in der jeweiligen Entität.
4. Zentrale Person hält offiziellen Vor- und Nachnamen. Migration erst nach Dubletteninventur und manueller Mappingentscheidung; vorhandene Namen zunächst als Kompatibilitätsfelder erhalten.
5. Dashboard-Nickname als optionales reines Accountprofilfeld ist sinnvoll. Er darf niemals offizielle Trainer-/Vorstandsnamen ersetzen.
6. Account-E-Mail und öffentliche Kontakt-E-Mails ausdrücklich trennen. Zusätzlich entscheiden, ob Notification-E-Mail Auth folgt oder als eigene bestätigte Account-Kommunikationsadresse geführt wird.
7. E-Mail-Fallbacks in Lookup/RLS erst entfernen, wenn Live-Daten vollständig ID-konsistent sind und alle Policies inventarisiert wurden. Änderungen in gestuften, rollbackfähigen Blöcken.
8. Dashboard-, Trainer- und Vorstandsbild bleiben drei unabhängige zentrale Media-Usages. Keine zweite Uploadstruktur.

Diese Option wurde nach Abschluss der Analyse verworfen. Eine allgemeine Personenmigration ist kein Ziel von B15.23.

## Betroffene Regressionen

Login, Einladung, Passwort-Reset/Recovery, Benutzerverwaltung, eigenes Profil, Rollen/Permissions/Scopes, Proxy/Navigation, Trainer-CRUD und öffentliche Trainerdarstellung, Vorstand-CRUD und öffentliche Vorstandsdarstellung, Clubkontakte, Mannschaftsseiten, Profile-Card-Linking, Notifications und persönliche Preferences, Notification-Mail-Delivery, Membership-Zuständigkeiten/Weiterleitungen, Media Assignment/Archivschutz, Audit/Monitoring und Auth-Mails.

## Ursprünglich erwogene Folgeblöcke (verworfen)

- **B15.23B – Live-Auswertung und fachliche Identitätsentscheidungen:** Preflight auswerten; zentrale Namensverantwortung, Notification-Adresse, Kardinalitäten und Migrationsregeln festlegen.
- **B15.23C – Additives Personen-/Account-Schema und Security-Design:** nur nach B; Proposal, Rollback und Postcheck, ohne automatischen Backfill.
- **B15.23D – Kontrolliertes Mapping/Backfill:** Dubletten manuell klären, explizite IDs setzen, Fingerprints und Rollback sichern.
- **B15.23E – Anwendungsintegration:** Read-/Write-Pfade auf zentrale Person plus funktionsbezogene Profile umstellen; Legacy-Fallbacks zunächst erhalten.
- **B15.23F – Dashboardprofil und eigenes Media-Bild:** optionaler Nickname und separate zentrale Media-Usage mit enger Self-Service-Feldallowlist.
- **B15.23G – E-Mail- und Auth-Härtung:** bestätigter Auth-E-Mail-Change, Notification-Adresse und Entfernung historischer E-Mail-Identitätsfallbacks erst nach vollständiger Regression.
- **B15.23H – Legacy-Cleanup:** alte Namens-/E-Mail-/Bildfelder ausschließlich nach nachgewiesenem Null-Read/Null-Write entfernen.

## Offene Entscheidungen nach dem Preflight

- Sind alle produktiven `admin_profiles.id` tatsächlich Auth-UUIDs?
- Welche E-Mail-Abweichungen und Dubletten existieren, ohne Werte offenzulegen?
- Sind Profile-Card-FKs und Unique-Indizes live vollständig vorhanden?
- Welche RLS-Policies verwenden noch E-Mail als Identitätsfallback?
- Soll Notification-Mail strikt Auth folgen oder eine eigene bestätigte Account-Adresse besitzen?
- Dürfen mehrere historische Funktionszeilen derselben Art einer Person zugeordnet werden oder nur eine aktive?

## Ablösung der ursprünglichen Architektur-Empfehlung

Die oben dokumentierte `persons`-Variante bleibt nur als historischer Analyseweg lesbar und ist **nicht** mehr Zielarchitektur. Es wird keine neue allgemeine Personen-FK, keine Trainer-/Vorstandsmigration und keine E-Mail-Zentralisierung geplant. B15.23C darf später einen optionalen Dashboard-Nickname und ein eigenes zentrales Dashboardbild ergänzen; Trainer- und Vorstandsbild bleiben davon unabhängig.
