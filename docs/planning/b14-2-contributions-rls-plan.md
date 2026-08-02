# B14.2 - Contributions RLS Plan

## 1. Datenzugriffsmodell

Das Modul `Vereinsbeitraege` soll technisch als serverseitiges Admin-Modul umgesetzt werden. Browser-Komponenten erhalten nur vorgefilterte DTOs aus Server Components oder Server Actions. Direkte Client-Supabase-Zugriffe auf `player_contributions` und `player_contribution_payments` sind nicht vorgesehen.

## 2. Server Actions

- Listen, Detailansichten und Exporte laufen ueber Server Components oder serverseitige Services.
- Schreibpfade fuer Beitrag, Zahlung, Stundung, Befreiung und Storno laufen ueber Server Actions.
- Jede Mutation prueft vor dem DB-Zugriff die Admin-Permission explizit.
- `amount_paid` und der finale Status werden nicht aus dem Browser uebergeben, sondern serverseitig oder per DB-Trigger synchronisiert.

## 3. Client-Grenzen

- keine direkte `supabase.from('player_contributions')` Nutzung im Browser
- keine sensiblen Felder wie interne Notizen, Storno- oder Befreiungsgruende ohne Permission an Client-Komponenten senden
- keine Team-Scope-Vererbung fuer Trainer oder Jugendleiter
- kein Finanzstatus in oeffentlichen Player-, Team- oder Dashboard-Komponenten

## 4. Notwendige Policies

Spaetere RLS-Absicherung sollte mindestens vorsehen:

- keine `anon`- oder `public`-Lesepolicy
- keine allgemeinen `authenticated`-Read-Policies mit `true`
- Server-Role oder definierte Admin-Pfade als primaerer Write-Kanal
- falls direkte DB-Zugriffe spaeter noetig werden: read/write nur fuer Superadmin und Kassierer, optional read/export fuer Vorstand

## 5. Permission-Pruefung

Anwendungsebene:

- `contributions.view`
- `contributions.create`
- `contributions.edit`
- `contributions.record_payment`
- `contributions.cancel_payment`
- `contributions.defer`
- `contributions.exempt`
- `contributions.cancel`
- `contributions.export`

DB-Ebene spaeter:

- RLS dient als zweite Schutzschicht
- die fachliche Autorisierung bleibt trotzdem in Server Actions notwendig

## 6. Risiken

- bestehende Scope-Drafts in `src/lib/admin-auth/scopes/scopeEngine.js` sind fuer sensible Finanzdaten zu offen
- vorhandene RLS-Muster im Projekt enthalten teils breite `public`- oder `authenticated`-Policies; dieses Muster darf fuer Contributions nicht uebernommen werden
- wenn spaeter Player-Loeschpfade aktiv bleiben, koennen FKs mit `NO ACTION` zu gewollten Delete-Fehlern fuehren

## 7. Empfohlener Zeitpunkt

RLS sollte nicht schon in B14.2 eingefuehrt werden. Empfehlung:

1. additives Schema und Permissions anlegen
2. serverseitige Repository-/Action-Pfade bauen
3. Admin-UI mit ausschliesslich serverseitigem Datenzugriff fertigstellen
4. danach gezielte Contributions-RLS als gesonderten Schritt mit Postcheck einfuehren
