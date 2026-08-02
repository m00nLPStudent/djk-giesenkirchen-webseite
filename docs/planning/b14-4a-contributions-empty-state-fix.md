# B14.4A - Contributions Empty-State Fix

## 1. Fehlerbild

Beim Aufruf von `/admin/contributions` crashte die Seite auf leerer Datenbank mit:

`TypeError: Cannot read properties of null (reading 'amountPaid')`

## 2. Root Cause

- Die Uebersichtsseite ruft `getContributionUiState(null, permissionKeys)` auf, um Button-Sichtbarkeit fuer den leeren Zustand zu bestimmen.
- In `src/components/admin/contributions/helpers/contributionUiState.js` griff `hasPaidAmount(contribution)` ungeschuetzt auf `contribution.amountPaid` zu.
- Bei `null` statt eines Contribution-Objekts entstand dadurch der serverseitige TypeError bereits vor dem eigentlichen Empty-State-Render.

## 3. Betroffene Datei/Funktion

- Hauptursache: `hasPaidAmount(...)` in `src/components/admin/contributions/helpers/contributionUiState.js`
- gehaertete Service-Grenze: `loadContributionStats(...)` in `src/components/admin/contributions/services/contributionStats.service.js`

## 4. Datenfluss vorher

1. `/admin/contributions` laedt Overview-Daten.
2. Die Seite bestimmt UI-Rechte fuer Header-Aktionen ueber `getContributionUiState(null, permissions)`.
3. `canExempt` ruft intern `hasPaidAmount(null)` auf.
4. Zugriff auf `null.amountPaid` wirft die Exception.

Parallel dazu war der Stats-Service zwar fuer leere Arrays robust genug, aber noch nicht zentral gegen rohe `null`-Moneyfelder gehaertet.

## 5. Datenfluss nachher

1. `getContributionUiState(...)` toleriert `null` sicher.
2. `loadContributionStats(...)` normalisiert Listen- und Moneywerte zentral.
3. Overview und Dashboard erhalten immer ein vollstaendiges Stats-DTO.
4. Leere Tabellen, saisonleere Treffer und filterleere Treffer rendern ohne Serverexception.

## 6. Default-Stats-DTO

```js
{
  totalCount: 0,
  openCount: 0,
  partiallyPaidCount: 0,
  paidCount: 0,
  deferredCount: 0,
  exemptCount: 0,
  canceledCount: 0,
  overdueCount: 0,
  totalDue: "0.00",
  totalPaid: "0.00",
  totalWaived: "0.00",
  totalOutstanding: "0.00",
  paymentsCurrentSeason: "0.00",
}
```

Es liegt zentral in `contributionStats.defaults.js` und wird pro Request als frische Kopie ausgegeben.

## 7. Empty-State-Verhalten

- `/admin/contributions` rendert bei 0 Datensaetzen:
  - Kennzahlen mit `0`
  - Geldwerte mit `0,00 EUR`
  - leeren Zustand mit verstaendlichem Hinweis
  - Button `Ersten Beitrag anlegen`, wenn `contributions.create` vorhanden ist
- Keine Tabelle und keine fehlerhaften Dummy-Zeilen

## 8. Dashboard-Auswirkung

Die Contributions-Kachel auf `/admin` nutzt dieselbe Stats-Funktion und profitiert ohne zweite Sonderlogik vom gleichen Fix.

## 9. Tests

- Stats-Service mit leerem Repository-Ergebnis
- Stats-Service mit `null`-Moneywerten
- Stats-Service mit echten Werten
- frische Default-Stats-Kopie je Request
- Overview-Datenservice mit 0 Beitragen
- saison- und statusleere Treffer
- UI-State mit `null`-Contribution

## 10. Offene Risiken

- Ein echter Browser-Realtest mit authentifizierter Admin-Session ist im Terminalkontext nur eingeschraenkt reproduzierbar.
- Der Overview-Service laedt weiterhin die gefilterte Ergebnismenge und paginiert danach im Node-Prozess; das ist fuer diesen Fix unveraendert.
