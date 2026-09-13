# B15.24L – Accessibility, Performance und SEO

Status: **COMPLETE – MANUAL QUALITY REVIEW PASSED**

Stand: 13. September 2026. Der Audit basiert auf Repository-Inventur, Next.js-16-Verträgen, automatisierten Strukturtests, Produktionsbuild und lokalem Production Preview. Es werden keine erfundenen Lighthouse- oder Web-Vitals-Werte angegeben.

## A) Accessibility Findings

Inventarisiert wurden zehn relevante Verträge:

1. **Behoben – Tastaturzugang:** Der öffentliche Shell fehlte ein Skip-Link. Jede öffentliche `main`-Variante besitzt nun das stabile Ziel `main-content` und ist programmatisch fokussierbar.
2. **Behoben – Reduced Motion:** Globales Smooth-Scrolling und Transitions hatten keine Reduktionsregel. `prefers-reduced-motion: reduce` schaltet Scrollanimationen sowie Animationen/Transitions praktisch ab.
3. **Bestätigt – Landmarks:** Öffentliche Seiten besitzen Header, beschriftete Navigationen, genau einen gerenderten Main-Landmark und Footer. `html` verwendet `lang="de"`.
4. **Bestätigt – Navigation:** Desktop- und Mobilnavigation verwenden Links für Navigation, Buttons für Untermenüs, `aria-expanded`, `aria-controls`, `aria-current`, Escape-Schließen und sichtbare Fokusklassen. Hover ist nicht der einzige Öffnungsweg.
5. **Bestätigt – Touch-Ziele:** Zentrale mobile Menü- und Toggle-Schalter verwenden mindestens 44 × 44 Pixel.
6. **Bestätigt – Formgrundlagen:** Die geprüften Login-, Membership- und zentralen Adminfelder besitzen sichtbare beziehungsweise programmatisch verbundene Labels; Pflichtfelder und differenzierte Fehlermeldungen bleiben erhalten.
7. **Offen – Fehlerfokus:** Ein konsistenter automatischer Fokus auf die erste ungültige Eingabe ist nicht über alle historischen Adminformulare nachweisbar. Keine globale Fokusmutation wurde ohne komponentenspezifischen Browsertest eingeführt.
8. **Offen – Dialogfokus:** Mehrere historisch individuell implementierte Admin-Dialoge besitzen keinen einheitlich nachgewiesenen Focus-Trap-/Fokusrückgabe-Vertrag. Das erfordert einen separaten kontrollierten Dialogblock und Tastaturreview.
9. **Teilweise bestätigt – Bilder:** Informative Logos, Personen-, Team- und Inhaltsbilder besitzen kontextbezogene Alttexte; Platzhalter bleiben beschreibend. Mehrere dynamische/externe Bilder verwenden weiterhin `<img>` und benötigen eine spätere host- und dimensionsbezogene Einzelfallentscheidung.
10. **Manuell zu bestätigen – Kontrast/Überschriften:** Die Struktur verwendet im Regelfall einen sichtbaren H1 und nachfolgende H2/H3. Vollständige Kontrastmessung und visuelle Überschriftenprüfung bleiben Teil des Betreiberreviews; Farbe wird bei Statusangaben nicht als einziger Informationsträger vorausgesetzt.

## B) Performance Findings

Neun Performanceverträge wurden geprüft:

1. Der Produktionsbuild ist erfolgreich und weist DB-abhängige Trainings- und Mannschaftsrouten request-dynamisch aus; es wurde keine statische Datenvereisung eingeführt.
2. Homepage-Trainings werden zentral erzeugt, chronologisch zusammengeführt und erst danach limitiert; Department-Scope bleibt unverändert.
3. Der zentrale Training-Loader parallelisiert Trainingszeiten, Ausnahmen und Schließzeiten, nutzt aber weiterhin bestehende `select("*")`-Abfragen. Eine Spaltenreduktion wurde ohne vollständigen Live-Schema-Vertrag nicht riskiert.
4. TT-Mannschaftsdaten werden gebündelt geladen; im geprüften Vertrag wurde kein neues N+1 eingeführt.
5. Header und Footer lesen beide öffentliche Clubsettings. Eine requestweite Zusammenführung wäre möglich, wurde aber wegen Layout-/Caching-Grenzen nicht ohne Messbeleg vorgenommen.
6. FUSSBALL.DE lädt das offizielle Script über den bestehenden Singleton-Lifecycle; doppelte Widgets werden bereinigt. Domainbindung und Cross-Origin-Grenzen bleiben unverändert.
7. click-TT bleibt server-only und verwendet weiterhin 15 Minuten Revalidation. Keine Providerdaten werden clientseitig neu geladen.
8. Dynamische und externe Bilder bleiben der größte belegte Optimierungskandidat. Eine blinde Umstellung auf `next/image` ist wegen unbekannter Storage-/Providerdimensionen und Remote-Host-Verträge nicht sicher.
9. Es ist keine Lighthouse-Installation vorhanden. Deshalb wurden keine synthetischen Scores behauptet; Build und Preview-Smokes bilden die reproduzierbare technische Baseline.

Es wurde bewusst kein globaler Cache, keine Providerarchitektur, kein Datenbankindex und kein Renderingmodus ohne konkreten Nachweis verändert.

## C) SEO Findings

Zehn SEO-Verträge wurden geprüft:

1. **Behoben:** Root-Metadata besitzt nun Titel-Template, Beschreibung, deutschen OpenGraph-Fallback und optional eine validierte `metadataBase`.
2. **Behoben:** Indexierung ist fail-closed und nur bei `PUBLIC_SITE_INDEXING_ENABLED=true` plus valider HTTPS-`NEXT_PUBLIC_SITE_URL` aktiv.
3. **Behoben:** `robots.js` sperrt Staging vollständig. Bei explizit freigegebener Produktion bleiben `/admin/`, `/api/` und `/auth/` ausgeschlossen.
4. **Behoben:** `sitemap.js` liefert im Staging keine URLs und verwendet in Produktion ausschließlich die validierte Basis-URL.
5. **Bestätigt:** Adminlayout und E-Mail-Bestätigungsroute tragen explizites `noindex`, `nofollow` und `nocache`.
6. **Teilweise offen:** 11 der 44 Public-Pages besitzen bereits routenspezifische Metadata. Der globale Fallback verhindert leere Titel, ersetzt aber noch keine individuellen Metadaten für alle 33 übrigen Seiten.
7. **Teilweise offen:** Die sichere statische Sitemap enthält bestätigte öffentliche Hauptseiten, aber noch keine datengetriebenen News-, Event- und Teamdetail-URLs. Testdaten werden nicht hardcodiert.
8. **Behoben:** Canonical-/Sitemap-/Host-Ausgaben können weder `localhost`, öffentliches HTTP, Credentials noch URLs mit Pfad/Query/Fragment als Produktionsbasis verwenden. Es wird kein global falscher Canonical erzeugt.
9. **Offen:** Korrekte strukturierte Daten für `SportsOrganization`, Events und Breadcrumbs benötigen finale Vereins-/Impressumsdaten und einen eigenen datengetriebenen Vertrag; keine Fake-Daten wurden erzeugt.
10. **Bestätigt/offen:** Next.js liefert für nicht gefundene Routen den technischen 404-Vertrag; eine vereinseigene 404-/Error-UX ist noch nicht vorhanden und bleibt ein separater risikoarmer Folgepunkt.

### Staging-SEO-Vertrag

- Default ist `noindex, nofollow, nocache` und `robots.txt: Disallow: /`.
- Erst `PUBLIC_SITE_INDEXING_ENABLED=true` aktiviert Indexierung.
- Zusätzlich ist eine valide HTTPS-`NEXT_PUBLIC_SITE_URL` zwingend; localhost bleibt auch bei gesetztem Schalter nicht indexierbar.
- Die Abnahme-/Tunneladresse wird nicht hardcodiert und erscheint nicht in Sitemap oder Canonicals.
- Für Go-live müssen finale Domain, Redirects, robots und sitemap im Deployment manuell geprüft werden.

## D) Implemented Fixes

- zentral validierter Public-SEO-/Staging-Vertrag
- dynamische `robots.txt`- und `sitemap.xml`-Metadatenrouten
- explizites Admin-/Auth-`noindex`
- globales Titel-Template und OpenGraph-Fallback
- öffentlicher Skip-Link mit stabilem Main-Ziel
- Reduced-Motion-Vertrag
- automatisierte SEO-/Accessibility-Strukturtests

## E) Deferred Items

- visueller WCAG-Kontrast- und vollständiger Keyboard-/Screenreader-Review
- vereinheitlichte Focus-Traps und Fokusrückgabe historischer Admin-Dialoge
- automatische Fehlerfokussierung über alle historischen Formulare
- routenspezifische Metadata für noch nicht abgedeckte Public-Seiten
- datengetriebene Sitemap für veröffentlichte News, Events und Teams
- Organization-/Event-/Breadcrumb-Structured-Data nach finaler Inhaltsfreigabe
- kontrollierte Einzelmigration dynamischer Bilder nach Host-/Dimensionsinventur
- Lighthouse/Web-Vitals in einer reproduzierbaren produktionsnahen Umgebung

## F) Cookie-/DSGVO-Inventar

- **FUSSBALL.DE:** Externes Script und Cross-Origin-iframe werden auf den expliziten Spielbetriebsseiten geladen; Consent-Klassifizierung bleibt im nachfolgenden DSGVO-Block zu entscheiden.
- **click-TT/myTischtennis:** Abruf erfolgt serverseitig mit 15-Minuten-Revalidation; der Browser erhält normalisierte Daten, kein Provider-Script.
- **Google Maps:** Normale Links laden keinen Embed. Ein vorhandener Embed wird erst nach bewusstem Klick geladen; echte Consent-Persistenz fehlt weiterhin.
- **Supabase Auth:** Admin/Auth verwendet technische Session-Cookies; keine neue Speicherung wurde eingeführt.
- **Local/Session Storage:** Bestehende UI-Zustände sind zu klassifizieren; keine Analytics- oder Marketingpersistenz wurde gefunden.
- **Analytics/Tracking:** Kein Analytics-, Tag-Manager- oder eigenes Tracking-Script im untersuchten Produktcode nachgewiesen.
- **Social Media:** Öffentliche Icons sind normale externe Links und betten keine Social-Widgets ein.

Dieser Abschnitt ist ausschließlich Inventar. Die bestehende `/cookie-einstellungen`-Seite ist weiterhin keine fertige Consent-Lösung.

## G) Manueller Quality Review

Der Betreiberreview ist vollständig bestanden: Skip-Link und Hauptinhaltsfokus, Tab/Shift+Tab/Enter/Escape, sichtbare Fokuszustände, Desktop- und Mobilnavigation, Formbedienung, Labels/Fehlerdarstellung sowie 200-%-Zoom wurden ohne akute Accessibility-Blockade bestätigt. Zentrale Public-Seiten blieben ohne relevante horizontale Überbreite nutzbar.

Das subjektive Ladeverhalten war unauffällig. Insbesondere öffnete `/tischtennis/trainingszeiten` im realen Browser nahezu sofort. Der einzelne Production-Preview-Wert von rund 10,5 Sekunden bleibt als nicht reproduzierter Messausreißer dokumentiert und begründet keine spekulative Cache-, DB- oder Architekturänderung.

Der stagingweite `noindex`-Vertrag ist für die Vorstands-/Abnahme-Subdomain ausdrücklich bestätigt. Production-Indexierung bleibt bis zur bewussten Aktivierung mit finaler HTTPS-Domain gesperrt.

Die folgenden Punkte sind nicht blockierende Follow-ups: weiter verfeinerte individuelle Route-Metadata, Structured Data, eigene Vereins-404-UX, vollständige instrumentelle Kontrastmessung und ein separater Dialog-Fokus-Audit bei Bedarf.

Cookie/DSGVO ist der **NEXT BLOCK / NOT STARTED**. Das zentrale Corporate-Design-E-Mail-Template folgt erst danach und wurde in B15.24L nicht begonnen.

### Abgeschlossener Reviewumfang

1. Desktop und Mobil: Skip-Link per Tab fokussieren und auslösen.
2. Haupt-, Football-, TT- und Mobile-Navigation vollständig per Tastatur bedienen; Escape und Fokusreihenfolge prüfen.
3. Login, Mitgliedsantrag und repräsentative Adminformulare inklusive Fehler-/Erfolgszuständen testen.
4. Hauptseiten bei 200 % Zoom sowie 360/390/430 Pixel prüfen.
5. Kontraste und Fokusindikatoren visuell messen.
6. Seitentitel/OpenGraph in Startseite, Verein, Football, TT, News und Termine prüfen.
7. In der Abnahmeumgebung `/robots.txt` auf vollständiges Disallow und `/sitemap.xml` auf leere Ausgabe prüfen.
8. Admin/Auth-Quelltext auf `noindex,nofollow` prüfen.
9. Vor Go-live mit finaler Domain den Indexierungsschalter bewusst aktivieren und robots/sitemap erneut prüfen.
10. Ladegefühl der im Auftrag genannten Hauptseiten in Development und Production Preview vergleichen; Lighthouse später in stabiler produktionsnaher Umgebung ausführen.
