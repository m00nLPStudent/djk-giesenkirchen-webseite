# Tischtennis-Competition-Provider-Fallback

Stand: **26. September 2026 · Version 1.0.7**

Status: **ZURÜCKGESTELLT – NUR BEI ERNEUTEM ODER DAUERHAFTEM PROBLEM**

## Aktueller Betriebszustand

Die bestehende serverseitige myTischtennis-/click-TT-Integration funktioniert auf `djkvfl-test.de` wieder. Die Wiederherstellung erfolgte ohne Code-, Datenbank-, Environment-, Deployment- oder Node-Änderung. Ein Wechsel auf WTTV ist deshalb kein aktiver Entwicklungsblock, keine akute Betriebsaufgabe und keine Migration.

Die aktuelle Laufzeitkette bleibt unverändert:

`Public UI → tableTennisPublic.repository → competition.service → clickTt.server → www.mytischtennis.de → HTML/Hydration → Competition DTO → TableTennisCompetitionView`

Supabase speichert dabei ausschließlich die Team-/Saison-Konfiguration. Tabelle und Spielplan werden zur Laufzeit serverseitig vom Provider geladen.

## Beobachteter temporärer Providerfehler

- Lokal funktionierte die Integration, während Hetzner zeitweise die bestehenden Fallback-Hinweise anzeigte.
- Die reine Diagnose zeigte für den myTischtennis-Abruf eine Weiterleitung auf `/verify?from=...` und anschließend HTTP `429` – sowohl über IPv4 als auch IPv6.
- Der vorhandene Cache-/Revalidate-Vertrag beträgt 15 Minuten (`900` Sekunden).
- Die Integration erholte sich später ohne Änderung am Repository oder an der Betriebsumgebung.
- Es wird keine Provider-Verifikation umgangen und keine nicht öffentliche Schnittstelle erzwungen.

## WTTV als inaktiver Plan B

Die öffentlich erreichbaren WTTV-Seiten wurden nur als mögliche Ausweichquelle untersucht:

- Der WTTV-Host war erreichbar (`200`).
- Für die bekannte Gruppe `522365` war der Championship-Scope `Niederrhein 26/27` erreichbar (`200`).
- Die Gruppenansicht verwendet `displayTyp=gesamt`; `displayDetail=table` und `displayDetail=meetings` liefern die fachlich benötigten Teilansichten.
- Die öffentlich sichtbaren Felder reichen grundsätzlich für Tabelle und Spielplan aus.

Eine Umstellung würde die bestehende Public-UI, DTOs und View-Komponenten möglichst unverändert lassen. Geändert würden nur Provideradapter, URL-/Parsinglogik, Fixtures und providerbezogene Tests. Fehlerzustände müssten weiterhin fail-closed und ohne rohe Providerdetails dargestellt werden.

## Gesicherter Datenbank-Preflight

Der weiterhin aufzubewahrende Read-only-Preflight liegt unter [b15-table-tennis-wttv-provider-preflight-readonly.sql](../sql/b15-table-tennis-wttv-provider-preflight-readonly.sql).

Die manuelle Auswertung bestätigte:

- drei aktive `click_tt`-Konfigurationen;
- 1. Herren: Gruppen-ID `522365`;
- 2. Herren: Gruppen-ID `522475`;
- Senioren: Gruppen-ID `522752`;
- keine fehlenden Team-/Saisonreferenzen;
- keine falsche Abteilungszuordnung;
- `external_team_id` ist ein generisches Textfeld und kann fachlich eine WTTV-Teamtable-ID aufnehmen;
- es existiert kein geeignetes Feld für den Championship-Scope;
- keine abhängigen Views oder Funktionen blockieren eine additive Erweiterung;
- der Preflight hat keine Produktivdaten verändert.

Es wurde bewusst kein Proposal, kein Rollback, kein Postcheck und keine Migration erstellt oder ausgeführt.

## Reaktivierungskriterien und sichere Reihenfolge

Dieser Plan wird nur reaktiviert, wenn der myTischtennis-Zugriff erneut wiederholt oder dauerhaft ausfällt:

1. Laufzeitfehler auf Hetzner erneut diagnostizieren und Status, Redirect-/Verify-Verhalten sowie `429` belegen.
2. Den bestehenden 15-Minuten-Cache berücksichtigen und einen nur kurzzeitigen Providerzustand ausschließen.
3. Die öffentliche myTischtennis-Seite und die WTTV-Ausweichquelle erneut auf Erreichbarkeit und Vertragsstabilität prüfen.
4. Die WTTV-Teamtable-ID der 1. Herren mit dem bekannten Wert `4309992` verifizieren.
5. Die Teamtable-IDs der 2. Herren und Senioren separat ermitteln; sie sind aktuell unbekannt und dürfen nicht geraten werden.
6. Für jede Mannschaft den Championship-Scope nachweisen. Nur für Gruppe `522365` ist derzeit `Niederrhein 26/27` bekannt; die übrigen Scopes sind offen.
7. Den Read-only-Preflight erneut gegen den dann aktuellen Live-Stand ausführen.
8. Nur bei weiterhin notwendiger Umstellung eine additive Spalte `external_championship_scope` über den Standardprozess vorbereiten: Preflight, defensives Proposal, Rollback und Read-only Postcheck.
9. Den server-only Provideradapter implementieren, ohne Public-DTOs oder UI unnötig umzubauen.
10. Sanitized Fixtures sowie Parser-, Zeitzonen-, Sortierungs-, Deduplizierungs-, Cache- und Fehlerregressionen ergänzen.
11. Erst nach automatisierter und manueller Prüfung kontrolliert aktivieren; die bisherige Konfiguration bis dahin nicht überschreiben.

## Sicherheits- und Datenschutzvertrag

- Ausschließlich öffentlich erreichbare Providerseiten auswerten.
- Keine Zugangsdaten, Cookies oder Verifikationsmechanismen umgehen.
- Keine Providerantworten mit personenbezogenen oder technischen Rohdetails protokollieren.
- Keine unbekannten IDs oder Scopes schätzen.
- Keine Datenbankänderung ohne den etablierten vierstufigen SQL-Prozess.
