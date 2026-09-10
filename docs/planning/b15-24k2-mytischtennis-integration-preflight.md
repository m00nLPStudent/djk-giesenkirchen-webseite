# B15.24K2 – myTischtennis / click-TT Integration Preflight

Status: **DB PREFLIGHT PASSED – PROPOSAL READY FOR MANUAL EXECUTION**

Stand: 10. September 2026

## Scope und As-built

Dieser Block bewertet ausschließlich die technische und organisatorische Integrationsfähigkeit von Tabelle und Mannschaftsspielplan. Es wurde weder Produktcode noch Datenbank oder SQL verändert.

Der öffentliche Tischtennisbereich besitzt bereits einen `server-only`, saison- und departmentgebundenen Datenvertrag. `/tischtennis/spielplan-tabelle` sowie der Teamdetail-Tab `Spielbetrieb` zeigen bewusst den ehrlichen Zustand `external_integration_deferred`. Das bestehende Public-DTO enthält Team-, Saison-, Darstellungs-, Trainings- und Kontaktdaten, aber keine Spielbetriebsdaten oder click-TT-Zuordnung.

Football.de/FuPa liefern zwei vorhandene Vergleichsmuster: saisonale Providerfelder in `team_seasons`, serverseitiger HTML-Abruf mit Next-Revalidation und ein externer iframe. Keines davon ist ohne eigenen click-TT-Vertrag zu übernehmen. Die vorhandenen Felder sind providergebunden (`fussball_de_*`, `fupa_*`) und kein geeigneter neutraler Speicher für click-TT.

## Öffentlicher Quellenbefund

Geprüfte Referenz:

`https://www.mytischtennis.de/click-tt/WTTV/26--27/ligen/2._Bezirksliga_2/gruppe/522365/tabelle/gesamt`

- Die URL war ohne Login und ohne Anwendungssession per HTTP 200 als HTML erreichbar.
- Tabelle und Spielplan sind serverseitig im Dokument vorhanden. Zusätzlich enthält die Seite Hydration-Daten für den Client. Diese internen Daten sind keine öffentlich dokumentierte API.
- Die URL-Komponenten bilden Verband `WTTV`, Saison `26--27`, einen lesbaren Liga-Slug, die maßgebliche Gruppen-ID `522365` sowie Ansicht und Filter ab.
- Die Pfadfamilien `tabelle/{vr|rr|gesamt}` und `spielplan/{vr|rr|gesamt}` sind in der Seitennavigation erkennbar. Mannschaftsbezogene Spielplanpfade enthalten zusätzlich eine Team-ID und einen Team-Slug.
- Die eigene Mannschaft ist als `DJK VfL Giesenkirchen` identifizierbar; beobachtet wurden Team-ID `3105537` und Club-ID `11203`. Diese öffentlichen technischen IDs sind noch keine freigegebene Produktkonfiguration.
- Die Antwort wies ein Rate-Limit von 360 Abrufen je 30 Minuten aus. Ein Abruf pro Website-Request wäre deshalb ungeeignet.
- Bei der Prüfung waren keine `X-Frame-Options` und keine `frame-ancestors`-Direktive sichtbar. Das ist weder ein dauerhafter Embed-Vertrag noch eine Freigabe.

## Schnittstellen- und Vertragsbefund

Es wurde keine aktuelle, offiziell dokumentierte öffentliche API, kein dokumentierter JSON-/XML-/RSS-Feed und kein offizieller Widget-/Embed-Vertrag für diesen Zweck gefunden. Die öffentlich sichtbare HTML-Seite ist strukturiert und technisch serverseitig parsbar; die eingebetteten Hydration-Daten und mögliche interne Navigationsendpunkte bleiben jedoch undokumentierte Implementierungsdetails.

`robots.txt` erlaubt allgemeines Crawling. Das ersetzt weder Nutzungs- noch Wiederveröffentlichungsrechte. Datenschutz und Impressum bestätigen die öffentliche Bereitstellung von Tabellen, Ergebnissen und Mannschaftsdaten, enthalten aber keine belastbare technische oder rechtliche Freigabe für automatisierten Abruf und Wiederveröffentlichung auf einer Vereinswebsite. Vor einer Parser- oder iframe-Implementierung ist daher eine ausdrückliche Betreiber-/Providerklärung mit myTischtennis beziehungsweise WTTV erforderlich.

Ein iframe ist nicht zu bevorzugen: Er würde eine vollständige, fremd gestaltete und werbe-/trackinghaltige Drittseite einbetten, ist mobil schlecht kontrollierbar und müsste in die künftige Consent-Steuerung eingebunden werden. Die derzeitige Framebarkeit kann jederzeit geändert werden.

## Beobachtbarer Datenvertrag

Tabelle:

- Rang, Mannschaft, Begegnungen, Siege, Unentschieden, Niederlagen
- Spiel-, Satz- und Balanzwerte, Differenzen und Punkte
- Team-/Club-IDs, Tendenz und Zustandskennzeichen in den Hydration-Daten

Zählwerte sind ganzzahlig zu normalisieren; Verhältnis-, Differenz- und Punkteanzeigen sollten als validierte Darstellungswerte behandelt werden, weil Doppelpunkt-, Vorzeichen- und Sonderdarstellungen möglich sind. Positionen dürfen nicht lokal neu berechnet werden.

Spielplan:

- Datum und Uhrzeit beziehungsweise Start-/Endzeit
- Halle mit Nummer, Bezeichnung und Ortsdaten
- Heim- und Gastmannschaft sowie Team-/Club-IDs
- Ergebnis, Status (`scheduled`/`done`), Bestätigungs-/Abschlusszustand
- öffentliche Meeting-ID und gegebenenfalls öffentlicher Bericht-/PDF-Link
- Verlegungs- oder sonstige Kennzeichen, soweit von der Quelle geliefert

Bei einer reinen HTML-Tabellenanalyse müssten in Folgezeilen ausgelassene Datumswerte kontrolliert fortgeschrieben werden. Ein zukünftiger Parser darf ausschließlich Tabelle und Mannschaftsspielplan übernehmen, nicht Personenprofile, Kontakte, TTR-Werte oder individuelle Bilanzen.

## Empfohlenes Zielbild nach Freigabe

Integrationsreihenfolge:

1. Offizielle dokumentierte API oder ein vom Provider ausdrücklich freigegebener Datenzugang.
2. Offizielles, datenschutzrechtlich eingebundenes Widget/Embed, falls ein solcher Vertrag angeboten wird.
3. Nur mit ausdrücklicher Freigabe: serverseitiger Abruf der öffentlichen HTML-Seite, enger Parser, validiertes typisiertes DTO und eigene UI.
4. Ohne Freigabe: ausschließlich klar gekennzeichneter externer Link zur offiziellen Quelle.

Ein serverseitiger Parser dürfte fremdes HTML niemals direkt ausgeben und insbesondere kein `dangerouslySetInnerHTML` verwenden. Empfohlen sind ein URL-Allowlist-Vertrag ausschließlich für HTTPS auf `www.mytischtennis.de`, harte Größen-/Timeoutgrenzen, kontrollierte Redirects, Schema- und Wertevalidierung sowie sanitisierte Fehlerlogs.

Für freigegebenen Serverabruf wird eine Revalidation von zunächst 10 bis 15 Minuten empfohlen, ergänzt um den letzten erfolgreich validierten Stand als stale fallback. Bei Ausfall bleibt die Tischtennisseite verfügbar, kennzeichnet die Daten als derzeit nicht aktualisierbar und bietet den offiziellen Direktlink; es gibt keine Fake-Daten und keinen 500/404 der Gesamtseite.

Die Quelle ist sichtbar mit „Daten: myTischtennis / click-TT“ und einem externen Originallink zu kennzeichnen.

## Zuordnung, Saison und UI

Mehrere Tischtennismannschaften benötigen jeweils eine saisonbezogene Zuordnung. Fachlich gehört sie zu `team_seasons`, nicht zu einem hartcodierten Teamnamen. Minimaler späterer Konfigurationsvertrag:

- `external_provider = click_tt`
- Association/Verband, zum Beispiel `WTTV`
- externer Saison-Routenschlüssel, zum Beispiel `26--27`
- Gruppen-ID und validierter Liga-Slug
- externe Team-ID sowie kanonische Tabellen-/Spielplan-Quell-URL

Die bestehenden Football.de-/FuPa-Felder bilden diesen Vertrag nicht korrekt ab. Eine kleine DB-Erweiterung ist daher voraussichtlich erforderlich, darf aber erst nach Providerentscheidung und anschließendem Live-Schema-Preflight entworfen werden. Die Zuordnung soll im Tischtennis-Dashboard pro `team_season` pflegbar sein. Beim Saisonwechsel wird eine neue, vom Betreiber validierte Zuordnung für die neue Saison gespeichert; automatische Suche anhand von Namen ist nicht zuverlässig genug.

Empfohlene UI nach Freigabe:

- Teamdetail `Spielbetrieb`: vollständige Ligatabelle mit markierter eigener Mannschaft und ausschließlich Spiele dieses Teams, getrennt in kompakte Bereiche oder Untertabs.
- `/tischtennis/spielplan-tabelle`: Auswahl aller aktiv und gültig konfigurierten TT-Mannschaftssaisons; danach vollständige Ligatabelle plus Spielplan der ausgewählten Mannschaft. Ein kompletter Gruppenspielplan kann optional angeboten werden, ist aber nicht die primäre mobile Ansicht.

## Betreiberentscheidung und DB-Gate

Der Betreiber hat entschieden, die untersuchte öffentliche, aber inoffizielle Datenquelle defensiv zu verwenden. Der fehlende offizielle API-/Embed-Vertrag, die technische Austauschbarkeit und das Risiko einer unangekündigten Provideränderung bleiben ausdrücklich dokumentiert; eine offizielle Klärung mit myTischtennis/WTTV bleibt empfehlenswert.

Vor Produktcode ist nun das DB-Gate zu passieren. Vorbereitet sind:

- `b15-24k2-mytischtennis-config-preflight-readonly.sql`
- `b15-24k2-mytischtennis-config-change-proposal.sql`
- `b15-24k2-mytischtennis-config-rollback.sql`
- `b15-24k2-mytischtennis-config-postcheck-readonly.sql`

Die vorgeschlagene Relation `team_season_external_competitions` ist genau einmal an eine `team_seasons`-Zeile gebunden, enthält nur validierte URL-Bausteine und bleibt ohne Policies sowie ohne Rechte für `anon` und `authenticated` server-only. Kanonische URLs werden später ausschließlich im Provideradapter auf dem fest erlaubten Host konstruiert. Eine direkte Spaltenerweiterung von `team_seasons` wurde verworfen, weil deren öffentlicher Read- und authenticated-Mutationsvertrag die technische Providerkonfiguration unnötig verbreitern würde.

Der vollständige manuelle Live-Preflight K2P.01–K2P.13 ist bestanden. Bestätigt sind zwei TT-Teams, zwei aktive TT-Team-Seasons, 14 fachfremde Team-Seasons, die kollisionsfreie Zielrelation, die erforderlichen Rollen und `gen_random_uuid()`. Der tatsächliche Permission-Katalog besteht aus `admin_permissions`, `admin_role_permissions` und `admin_roles`; `teams.view`, `teams.edit` sowie `current_admin_permission_allows_department(text,uuid)` sind vorhanden.

Da `teams.edit` mehreren Rollen zugeordnet ist, stellt es allein keine ausreichende click-TT-Autorisierung dar. Das finale Proposal gibt der Rolle `authenticated` deshalb keinerlei Zugriff auf die neue Tabelle. Zusätzlich erzwingt ein nicht direkt ausführbarer Trigger bei jeder serverseitigen Anlage oder Änderung, dass die referenzierte Mannschaftssaison tatsächlich zum Department `tischtennis` gehört. Ein zweiter Unique-Vertrag verhindert, dass dieselbe externe Mannschaft derselben Gruppe und Saison mehreren lokalen Mannschaftssaisons zugeordnet wird. Die spätere Server Action muss vor Verwendung des Service-Role-Clients weiterhin Permission, Department, Team und Saison prüfen.

B15.24L bleibt bis zum Abschluss von K2 **NOT STARTED**.

## Implementierungsstand nach bestandenem DB-Postcheck

Die DB-Foundation und der vollständige manuelle Read-only-Postcheck sind bestanden. Der Produktpfad ist implementiert: Ein austauschbarer, ausschließlich serverseitiger click-TT-Adapter konstruiert URLs nur aus validierten Konfigurationsbausteinen auf dem festen Host `https://www.mytischtennis.de`, ruft Tabelle und Spielplan mit Timeout, Größenlimit und 15-Minuten-Revalidation ab und überführt ausschließlich Mannschafts-, Tabellen-, Spielplan-, Ergebnis- und Spielortdaten in providerneutrale DTOs. Fremdes HTML wird nie gerendert; fehlende oder veränderte Hydration-Strukturen führen zu einem strukturierten `unavailable`-Zustand.

Die bestehende Tischtennis-Mannschaftsbearbeitung enthält im Reiter `Spielbetrieb` die saisonbezogene Konfiguration. Lesen und Schreiben erfolgen ausschließlich nach `teams.edit`-, Team-, Department- und `team_season_id`-Prüfung über den serverseitigen Service-Role-Client. Football bleibt isoliert.

Die öffentliche Route `/tischtennis/spielplan-tabelle` ermittelt datengetrieben alle aktiven, konfigurierten Tischtennis-Mannschaftssaisons der aktuellen Saison. Eine gemeinsame Mannschaftsauswahl wechselt Tabelle und den strikt per externer Team-ID gefilterten Mannschaftsspielplan zusammen. Der bestehende Spielbetrieb-Tab jeder Teamdetailseite verwendet dieselbe Darstellung und denselben Service; unkonfigurierte Teams erhalten keinen Fremddatenfallback. Tabellen- und Spielplanfehler werden unabhängig dargestellt, die eigene Mannschaft wird zusätzlich textlich markiert und die Quelle dezent verlinkt. Die Route ist request-dynamisch, während Providerfetches weiterhin 15 Minuten revalidiert werden.

Der vollständige manuelle Dashboard-, Multi-Team-, Teamdetail- und Responsive-Browserreview ist bestanden. Beide derzeitigen TT-Mannschaften behalten getrennte saisonale Konfigurationen; Auswahlwechsel aktualisieren Tabelle und Spielplan gemeinsam und es wurde keine Cross-Team-Leakage festgestellt. Die DB-Foundation einschließlich RLS ohne Policies, ausschließlich Service-Role-CRUD und TT-Scope-Trigger wurde manuell ausgeführt und durch den Read-only-Postcheck bestätigt.

Die aktuellen Mannschafts- und Providerzuordnungen bleiben Test-/Entwicklungsdaten und sind vor Go-live für die tatsächliche Saison kontrolliert zu prüfen beziehungsweise neu zu pflegen. Der Zugriff auf die öffentliche click-TT-Seite ist keine dokumentierte offizielle Public API; der Adapter bleibt deshalb technisch isoliert und austauschbar. Eine zeitweise langsamere Dashboardreaktion war kein bestätigter Funktionsfehler. Messung und weitergehende Performanceanalyse bleiben B15.24L vorbehalten.

Status: **COMPLETE – DB PREFLIGHT, DB FOUNDATION, DB POSTCHECK, PROVIDER, DASHBOARD AND PUBLIC MULTI-TEAM REVIEW PASSED**.
