# B14.1 - Contributions Requirements

## 1. Ziel

Dieses Dokument bereitet ein eigenstaendiges Admin-Modul `Vereinsbeitraege` fuer die Verwaltung von Spielerbeitraegen vor. Der erste Ausbaustand ist bewusst eng gehalten und konzentriert sich auf Forderungen, Zahlungen und Statuspflege fuer Spieler.

## 2. Verbindlicher Scope

- Nur Spielerbeitraege
- Eine Beitragszeile pro fachlichem Forderungsfall
- Bezug zu Spieler und Saison
- Mehrere Zahlungen pro Beitragszeile
- Teilzahlungen
- Stundung
- vollstaendige Befreiung
- interne Notizen
- Auditfelder fuer Ersteller, letzte Aenderung und fachliche Sonderaktionen
- Historie offener Altbeitraege aus vergangenen Saisons

## 3. Ausgeschlossene Funktionen

- keine Mannschaftskassen
- keine Trainer- oder Coachbeitraege
- keine Eltern-/Schuldnerstammsaetze
- keine Spenden, Sponsoren, Strafgelder, Turniergebuehren oder allgemeine Buchhaltung
- kein PDF- oder DATEV-Export in Phase 1
- keine harten Loeschpfade als Normalfall
- keine Anzeige von Finanzdaten in oeffentlichen Seiten oder normalen Spieler-/Trainerkarten

## 4. Vorhandene B12-Artefakte

Gepruefte Artefakte:

- `docs/sql/noch-nicht-ausfuehren-b12-membership-contributions-proposal.sql`
- `docs/sql/noch-nicht-ausfuehren-b12-membership-contribution-payments-proposal.sql`
- `docs/modules/membership-contributions.md`
- `docs/planning/b12-role-scope-matrix.md`

Bereits vorbereitet in B12:

- Tabellenentwurf `membership_contributions`
- Tabellenentwurf `membership_contribution_payments`
- Statuswerte `open`, `partially_paid`, `paid`, `exempt`, `deferred`, `canceled`
- Auditfelder `created_by`, `updated_by`, `created_at`, `updated_at`
- `amount_paid` als Cache
- `amount_outstanding` als berechneter Wert
- Trigger-Idee fuer `updated_at`

Was nach B13 noch passt:

- Zahlungsverlauf in eigener Payment-Tabelle
- `amount_paid` als serverseitig gepflegter Cache
- Statuskatalog als Ausgangsbasis
- Auditfelder auf `admin_profiles`

Was fachlich oder technisch ueberholt ist:

- `coach_id` im Beitragsmodell passt nicht mehr zum jetzt verbindlichen Spieler-only-Scope
- `player_id xor coach_id` ist fuer Phase 1 unnoetig komplex
- `team_id` als Snapshot ist nach B13 schwach; `team_season_id` passt besser zum saisonalen Modell
- `season_key` als Text dupliziert das inzwischen produktive Saisonmodell; `season_id` ist vorzuziehen
- B12-Scope-Idee fuer Jugendkoordinator und Trainerzugriffe ist fuer Finanzdaten zu offen
- B12 enthaelt noch keinen sauberen Storno-/Korrekturpfad fuer einzelne Zahlungen

Aktueller Code-Stand:

- Keine produktive Admin-Route fuer Contributions vorhanden
- Keine produktiven Services oder Repositories fuer `membership_contributions`
- In `src/lib/admin-auth/scopes/scopeEngine.js` existieren nur vorbereitete Draft-Helfer fuer `contributions.view` und `contributions.edit`
- In `src/components/admin/players/stats/playerStats.helpers.js` ist `openContributions` nur ein Platzhalterwert `0`

## 5. Aktueller Datenbankstand

Ausgewertet wurde ausschliesslich `docs/datenbank_docu/`.

Dokumentiert vorhanden:

- `players`
- `seasons`
- `team_seasons`
- `player_team_seasons`
- `admin_profiles`
- `admin_roles`
- `admin_permissions`
- `admin_user_roles`
- `admin_role_permissions`

Nicht in den exportierten Tabellenlisten dokumentiert:

- `membership_contributions`
- `membership_contribution_payments`

Bewertung:

- Nach dokumentiertem Stand existieren die Beitrags-Tabellen nicht produktiv.
- Da kein Live-Read ausgefuehrt wurde, bleibt vor einer spaeteren Umsetzung `LIVE_PREFLIGHT_REQUIRED`.

## 6. Beitragszeitraum

Bewertete Varianten:

- A `pro Saison`: passt direkt zu `seasons`, zu Altbeitraegen, zu Spielerwechseln und zum saisonalen B13-Zielmodell
- B `pro Kalenderjahr`: fachlich moeglich, aber quer zum bestehenden Fussball-Saisonmodell
- C `pro Halbjahr`: fuer Phase 1 unnoetig komplex
- D `flexible Perioden`: fuer Phase 1 zu offen und reporting-feindlich

Empfehlung:

- Phase 1 verwendet `season_id -> seasons.id` als verpflichtenden Periodenbezug.
- Kein zusaetzlicher freier `period_key` in Phase 1.
- Lesbare Periodenanzeige erfolgt ueber `seasons.name` und `seasons.slug`.

Begruendung:

- offene Altbeitraege bleiben ueber dieselbe Saison referenzierbar
- Spielerwechsel zwischen Mannschaften aendern die Beitragshistorie nicht
- Spieler ohne aktuelle Mannschaft koennen trotzdem einen Beitrag in einer Saison behalten

## 7. Beitragstypen

Empfohlener kontrollierter Typkatalog fuer Phase 1:

- `seasonal_fee`
- `admission_fee`
- `adjustment`
- `credit`
- `special_fee`

Nicht als Vereinsbeitrag im Modul aufzunehmen:

- Strafgeld
- Mannschaftskasse
- Turniergebuehr
- Trainerbeitrag
- Spende
- Sponsoring

Empfehlung:

- Kein freies `contribution_key` als einzige Steuerung.
- Stattdessen ein kontrollierter `contribution_type`-Katalog.
- Optional zusaetzlich ein technischer `contribution_key` fuer spaetere Erweiterungen oder Exporte, aber nicht als freie UI-Eingabe in Phase 1.

## 8. Statusmodell

Verbindliche Statuswerte:

- `open`
  - Deutsch: Offen
  - Bedeutung: Forderung aktiv, noch keine Zahlung oder keine ausreichende Zahlung
  - Sollbetrag: `> 0`
  - Zahlbetrag: `0`
  - Offener Betrag: `> 0`
  - `paid_at`: `null`
  - Zusatzfelder: `due_date`
  - Wechsel: `partially_paid`, `paid`, `deferred`, `exempt`, `canceled`
- `partially_paid`
  - Deutsch: Teilweise bezahlt
  - Bedeutung: mindestens eine gueltige Zahlung, aber Rest offen
  - Sollbetrag: `> 0`
  - Zahlbetrag: `> 0` und `< Soll`
  - Offener Betrag: `> 0`
  - `paid_at`: `null`
  - Zusatzfelder: keine Pflicht ausser Zahlungshistorie
  - Wechsel: `open`, `paid`, `deferred`, `exempt`
- `paid`
  - Deutsch: Bezahlt
  - Bedeutung: Forderung vollstaendig ausgeglichen
  - Sollbetrag: `>= 0`
  - Zahlbetrag: `= Soll minus amount_waived`
  - Offener Betrag: `0`
  - `paid_at`: Pflicht, aus letzter zum Vollausgleich fuehrender Zahlung ableitbar
  - Zusatzfelder: keine
  - Wechsel: nur ueber Zahlungsstorno/Korrektur zurueck nach `partially_paid` oder `open`
- `deferred`
  - Deutsch: Gestundet
  - Bedeutung: Forderung bleibt bestehen, Faelligkeit verschoben
  - Sollbetrag: `> 0`
  - Zahlbetrag: `0` oder Teilbetrag
  - Offener Betrag: `> 0`
  - `paid_at`: `null`
  - Zusatzfelder: `deferred_until`, `deferred_reason`
  - Wechsel: `open`, `partially_paid`, `paid`, `exempt`, `canceled`
- `exempt`
  - Deutsch: Befreit
  - Bedeutung: Forderung fachlich erlassen
  - Sollbetrag: bleibt als Ursprung erhalten
  - Zahlbetrag: in Phase 1 normal `0`
  - Offener Betrag: `0`
  - `paid_at`: `null`
  - Zusatzfelder: `amount_waived`, `exemption_reason`, `exempted_at`, `exempted_by`
  - Wechsel: nur durch berechtigte manuelle Ruecknahme nach `open`
- `canceled`
  - Deutsch: Storniert
  - Bedeutung: Beitragsposition fachlich verworfen
  - Sollbetrag: Ursprung bleibt dokumentiert
  - Zahlbetrag: nur zulaessig, wenn vorher alle Zahlungen storniert oder ausgebucht wurden
  - Offener Betrag: `0`
  - `paid_at`: `null`
  - Zusatzfelder: `canceled_at`, `canceled_by`, `cancel_reason`
  - Wechsel: keine normale Rueckaktivierung; stattdessen neue Beitragsposition

Empfohlene Statuspfade:

- `open -> partially_paid -> paid`
- `open -> deferred -> open`
- `partially_paid -> deferred -> partially_paid`
- `open -> exempt`
- `open -> canceled`

## 9. Zahlungshistorie

Verbindliche Empfehlung:

- `player_contribution_payments` ist die fachliche Quelle der Wahrheit fuer Zahlungen.
- `amount_paid` bleibt als Cache in `player_contributions`.
- `amount_outstanding` wird serverseitig oder als berechnetes Feld aus `amount_due`, `amount_paid` und `amount_waived` abgeleitet.

Begruendung:

- Teilzahlungen bleiben revisionsfaehig
- Zahlungszeilen koennen storniert werden, ohne Historie zu verlieren
- Listen und Kennzahlen bleiben performant

## 10. Ratenzahlung

Empfehlung fuer Phase 1:

- keine eigene Ratenplan-Tabelle
- `installment_enabled` boolean
- `installment_note` text
- `next_due_date` date
- optional `expected_installment_count` integer
- echte Zahlungen weiterhin ausschliesslich ueber Payment-Zeilen

Bewertung:

- Zahlungshistorie plus Vereinbarungsfelder reichen fuer den ersten Ausbaustand aus
- eine eigene Plan-Tabelle waere erst ab formalen Ratenschemata mit festen Teilbetraegen sinnvoll

## 11. Stundung

Empfehlung:

- Stundung ist ein eigener Status `deferred`
- Pflichtfelder: `deferred_until`, `deferred_reason`
- keine automatische Zahlung
- keine automatische DB-Mutation nach Fristablauf
- nach Fristablauf muss die UI den Vorgang als pruefbeduerftig kennzeichnen und eine Rueckfuehrung nach `open` erlauben

## 12. Befreiung

Empfehlung:

- Phase 1 unterstuetzt nur vollstaendige Befreiung als explizite Aktion
- technisches Feld `amount_waived` wird trotzdem eingeplant, damit Ursprungssoll und Erlass getrennt nachvollziehbar bleiben
- Pflichtfelder: `amount_waived`, `exemption_reason`, `exempted_at`, `exempted_by`

Bewertung Teilbefreiung:

- fachlich moeglich
- fuer Phase 1 nicht als eigener UI-Prozess noetig
- spaeter ueber dasselbe Feldmodell oder alternativ ueber `credit` ausbaubar

## 13. Spieler-/Saisonbezug

Verbindliche Empfehlung:

- `player_id -> players.id` Pflicht
- `season_id -> seasons.id` Pflicht
- `team_season_id -> team_seasons.id` optional als historischer Snapshot

Begruendung:

- Beitragspflicht darf nicht von der aktuellen Mannschaft abhaengen
- `team_season_id` ist als Snapshot staerker als `team_id`, weil Mannschaft und Saison gemeinsam fixiert werden
- Spieler ohne Mannschaft bleiben zulaessig, daher `team_season_id` nullable

## 14. Eindeutigkeitsregeln

Empfehlung:

- genau ein aktiver regulaerer Saisonbeitrag pro `player_id + season_id`
- Korrekturen, Gutschriften und Sonderbeitraege duerfen mehrfach vorkommen
- Aufnahmegebuehren duerfen pro Spieler mehrfach nur mit explizitem Fachgrund vorkommen; fuer Phase 1 besser einmal pro Saison

Konkrete Constraint-/Index-Empfehlung:

- partieller Unique-Index auf `(player_id, season_id)` fuer `contribution_type = 'seasonal_fee'` und `status <> 'canceled'`
- optional zweiter partieller Unique-Index auf `(player_id, season_id)` fuer `contribution_type = 'admission_fee'` und `status <> 'canceled'`, falls Aufnahmegebuehr saisonbezogen bleiben soll

Keine globale Unique-Regel fuer alle Typen, weil sonst `adjustment`, `credit` und `special_fee` unnoetig blockiert werden.

## 15. Rollen und Permissions

Ist-Stand:

- vorhandener Rollen-Key fuer den Kassenwart ist technisch `kassierer`
- vorhandene Membership-Rechte betreffen nur `membership_requests.*`
- `contributions.*` existiert produktiv noch nicht in `src/lib/admin-auth/adminPermissions.js`

Empfohlener minimaler Permission-Satz:

- `contributions.view`
- `contributions.create`
- `contributions.edit`
- `contributions.record_payment`
- `contributions.cancel_payment`
- `contributions.export`

Zusatzrechte fuer fachlich saubere Sonderaktionen:

- `contributions.defer`
- `contributions.exempt`
- `contributions.cancel`

Empfehlung zu `contributions.delete`:

- nicht in Phase 1 vorsehen
- Beitragspositionen und Zahlungen werden storniert oder korrigiert, nicht hart geloescht

## 16. Admin-Routen

Empfohlene Routen:

- `/admin/contributions`
- `/admin/contributions/new`
- `/admin/contributions/[id]`
- `/admin/contributions/[id]/edit`

Zusaetzliche Server-Actions oder Dialogs spaeter:

- Zahlung erfassen
- Zahlung stornieren
- Beitrag stunden
- Beitrag befreien
- Beitrag stornieren

## 17. Uebersichtsseite

Empfohlene Kennzahlen:

- Gesamtzahl Beitragspositionen
- offen
- teilweise bezahlt
- bezahlt
- gestundet
- befreit
- storniert
- Gesamtsoll
- Gesamtgezahlt
- Gesamtoffen
- ueberfaellige Positionen

Empfohlene Filter:

- Saison
- Mannschaft als Snapshot
- Spieler
- Status
- Faelligkeitsfenster
- Beitragstyp

## 18. Detailansicht

Mindestinhalte:

- Spieler
- Saison
- Team-Snapshot
- Beitragstyp
- Sollbetrag
- erlassener Betrag
- gezahlter Betrag
- offener Betrag
- Status
- Faelligkeitsdatum
- Zahlungszeitleiste
- Stundungsdaten
- Befreiungsdaten
- interne Notizen
- Ersteller / letzter Bearbeiter

## 19. Dashboard und Sidebar

Empfehlung:

- neuer Sidebar-Eintrag `Vereinsbeitraege`
- Sichtbarkeit nur bei `contributions.view`
- eigenes Icon im Finanz-/Warnkontext, z. B. `Wallet`, `Receipt` oder `BadgeEuro`
- Dashboard-Kachel nur fuer `superadmin`, `kassierer` und optional `vorstand`

Empfohlene Dashboard-Kennzahlen:

- offene Beitraege
- ueberfaellige Beitraege
- teilweise bezahlte Beitraege
- Zahlungseingaenge der aktuellen Saison

Keine Finanzkennzahlen fuer Trainer, Betreuer, Jugendkoordinator oder Gast.

## 20. Export

Empfehlung:

- CSV-Export bereits in Phase 1 sinnvoll

Empfohlene Exportfelder:

- Spieler-ID
- Spielername
- Saison
- Team-Snapshot
- Beitragstyp
- Sollbetrag
- amount_waived
- gezahlter Betrag
- offener Betrag
- Status
- Faelligkeitsdatum
- letzte Zahlung

Nicht standardmaessig exportieren:

- interne Notizen
- interne Begruendungen fuer Befreiung oder Stundung

## 21. Empfohlenes Datenmodell

Eindeutige Empfehlung:

- Variante B
- `player_contributions`
- `player_contribution_payments`

Begruendung:

- passt exakt zum Spieler-only-Scope
- vermeidet Verwechslungsgefahr mit dem bereits produktiven Modul `membership_requests`
- reduziert die fachlich ueberholte Polymorphie aus B12
- bleibt spaeter erweiterbar, ohne in Phase 1 unnoetige Generalisierung einzufuehren

Variante A `membership_contributions` bleibt als B12-Ausgangspunkt technisch brauchbar, ist aber jetzt semantisch zu breit.

Variante C mit polymorpher Personenzuordnung wird fuer Phase 1 klar abgelehnt:

- fachlich unnoetig
- sicherheitsseitig heikler
- macht Eindeutigkeitsregeln, Rechte und UI unnoetig komplex

## 22. Risiken

- Rollenbezeichnung im Bestand ist `kassierer`, waehrend fachlich oft `Kassenwart` gesagt wird
- alte B12-Scope-Ideen erlauben Trainer/Jugendkoordinator Lesesicht; das ist fuer sensible Finanzdaten neu zu entscheiden
- dokumentierter DB-Export zeigt die Beitrags-Tabellen nicht; vor Umsetzung ist ein Live-Preflight noetig
- `openContributions` existiert im Admin-Players-Bereich derzeit nur als Platzhalter und darf nicht stillschweigend als Finanzintegration missverstanden werden
- die bestehende Permissions-Registry enthaelt noch keine `contributions.*`-Keys

## 23. Offene fachliche Entscheidungen

- soll `vorstand` nur lesen/exportieren oder ebenfalls Zahlungen buchen duerfen
- soll `admission_fee` einmal pro Saison oder einmal pro Spieler zulaessig sein
- soll in Phase 1 bereits eine separate CSV-Exportberechtigung fuer `vorstand` gelten
- soll fuer `deferred` spaeter eine automatische Wiedervorlage oder ein Reminder eingefuehrt werden
- ob ein lesbarer Teamname-Snapshot zusaetzlich zum `team_season_id` gespeichert werden soll

## 24. Go-/No-Go-Kriterien

Go fuer die naechste Umsetzungsphase nur wenn:

- Spieler-only-Scope verbindlich bestaetigt
- Rollenentscheidung fuer `vorstand` und `jugendleiter` bestaetigt
- Tabellenbenennung `player_contributions` bestaetigt
- Statusmodell inkl. Stundung und Befreiung bestaetigt
- Preflight gegen Live-DB bestaetigt, dass die Tabellen noch nicht existieren oder bewusst neu migriert werden

No-Go wenn:

- wieder eine polymorphe Personenloesung verlangt wird
- Trainer oder teambasierte Leserechte fuer Finanzdaten in Phase 1 eingefuehrt werden sollen
- Zahlungshistorie nicht als Source of Truth akzeptiert wird

## 25. Empfohlener naechster Schritt

B14.2 sollte eine rein additive technische Zielarchitektur vorbereiten:

- finale Tabellen- und Spaltenfreigabe
- Permission- und Rollen-Erweiterung fuer `contributions.*`
- Preflight-SQL gegen Live-DB
- additive SQL-Proposals fuer `player_contributions` und `player_contribution_payments`
- danach erst UI-/Service-Planung fuer `/admin/contributions`
