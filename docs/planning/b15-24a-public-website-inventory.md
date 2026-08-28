# B15.24A – Öffentliche Website: konsolidierter IST-Stand

## Status und Grenze

B15.24A ist ein reiner Analyse- und Dokumentationsblock. Es wurden weder öffentliche Komponenten noch Navigation, Header, Footer, Datenbank oder SQL verändert. Die verbindliche Planungsquelle bleibt [`current-roadmap.md`](current-roadmap.md).

Die öffentliche Website ist fachlich als Website des **Gesamtvereins** zu behandeln. Der Gesamtverein umfasst Fußball, Tischtennis, Behindertensport und Gymnastikdamen. Das bestehende Grunddesign bleibt Ausgangspunkt; eine externe Referenzwebsite für Helligkeit, Flächenwirkung, Farbverteilung, Kontrast und Gesamtwirkung ist **OPEN INPUT**. Bis sie vorliegt, wird keine finale Farbpalette oder visuelle Detailentscheidung getroffen.

## Routeninventar

Der App-Router enthält im Route Group `(website)` 30 Seiten und zwei öffentliche Handler. Admin-, Auth- und API-Routen sind keine öffentlichen Website-Seiten und werden hier nicht mitgezählt.

Legende Responsive: „technisch“ bedeutet vorhandene responsive Utility-Klassen; eine visuelle Geräteabnahme ist damit nicht behauptet. „Risiko“ bezeichnet aus dem Code erkennbare Komplexität oder mögliche Engstellen.

| Route | Bereich | Zweck / Inhalt | Quelle und Hauptkomponenten | Responsive-IST / Auffälligkeit |
|---|---|---|---|---|
| `/` | Gesamtverein | Startseite mit News und Terminen | Supabase `news`, `events`, Kategorien/Typen, virtuelle Trainings; `NewsCard`, `HomeEventsSection` | technisch; schwerer dunkler Hero, keine eigene Metadata |
| `/verein` | Gesamtverein | Auswahl vorhandener Abteilungen | statische `clubAreas`, `Link`-Karten | technisch; Behindertensport fehlt, Gesamtvereinsinhalte fehlen |
| `/news` | Gesamtverein | sechs aktuelle Meldungen | Supabase `news`, Kategorien, zentrale Medienauflösung; `NewsCard` | technisch; überschneidet sich fachlich mit `/news/uebersicht` |
| `/news/uebersicht` | Gesamtverein | Suche und Pagination | Supabase `news`, Kategorien, Medien; `NewsCard` | technisch; Suchquery wird direkt in zusammengesetzten Filter übernommen, manuell prüfen |
| `/news/[slug]` | Gesamtverein | Newsdetail mit Titelbild, Richtext und Dokumenten | Supabase `news`, zentrale News-Medien; `RichTextContent` | Risiko bei langen Richtexten/Inline-Medien; native `<img>` |
| `/termine` | Gesamtverein | Einstieg Training/allgemeine Termine | statische Karten | technisch; keine Datenübersicht auf Einstieg |
| `/termine/allgemein` | Gesamtverein | vergangene und kommende Termine | Event-Service, Supabase Typen/Medien, Recurrence; `EventCard` | technisch; Listenmenge und lange Inhalte manuell prüfen |
| `/termine/training` | Gesamtverein | virtuelle Trainingstermine mit Zeitraumfilter | Trainings-/Event-Libraries, Typen; `EventCard` | technisch; Filter- und lange Listen mobil prüfen |
| `/termine/training/[occurrenceId]` | Gesamtverein | Trainingstermin-Detail | virtuelle Trainings, Maps, Teamlink | technisch, komplexe Detailseite; manuelle mobile Prüfung nötig |
| `/termine/[slug]` | Gesamtverein | Eventdetail, Kalenderlinks, Ort und Dokumente | Event-Service, Supabase Typen, zentrale Medien, Maps/Kalender | Risiko; 255 Zeilen, mehrere externe Links und native Bilder |
| `/kontakt` | Gesamtverein | öffentliche Vereinskontakte | Supabase `club_contacts`, zentrale Medien; Department-Komponenten | technisch; Jugendschutz nur datenabhängig, keine eigene Zielseite |
| `/mitglied-werden` | Gesamtverein | öffentliches Anfrageformular | Membership-Server-Action/API; `MembershipRequestForm` | technisch, aber 241-zeilige Client-Komponente; vollständige Geräteprüfung nötig |
| `/downloads` | Gesamtverein | veröffentlichte Downloads nach Kategorien | server-only Download-Service, zentrale private Medien; `DownloadsPublicPage` | technisch; finale mobile/optische Abnahme ausdrücklich offen |
| `/fussball` | Fußball | Abteilungsübersicht | statische Karten | technisch; enthält Link zu nicht vorhandener Turnier-/Eventseite |
| `/fussball/mannschaften` | Fußball | Auswahl Junioren/Senioren/Damen | statische Karten | technisch |
| `/fussball/mannschaften/junioren` | Fußball | aktive Juniorenteams | Team-Repository; `FootballTeamCard` | technisch; Bildkarten mobil prüfen |
| `/fussball/mannschaften/senioren` | Fußball | aktive Seniorenteams | Team-Repository; `FootballTeamCard` | technisch; Bildkarten mobil prüfen |
| `/fussball/mannschaften/damen` | Fußball | aktive Damenteams | Team-Repository; `FootballTeamCard` | technisch; Bildkarten mobil prüfen |
| `/fussball/[slug]` | Fußball | Mannschaft, Saison, Spieler, Trainer, Kontakt, Training und Wettbewerb | Supabase `teams`, `seasons`, `team_seasons`, saisonale Spieler/Trainer, zentrale Medien, Football.de; Team-Komponenten | hohes Risiko; 249 Zeilen, viele Datenpfade, Widgets/Tabellen und große Hero-Inhalte |
| `/fussball/[slug]/spieler/[playerId]` | Fußball | öffentliches Spielerprofil | Spieler-/Saisonmodelle, zentrale Medien; Player-Profile-Komponenten | technisch; personenbezogene Sichtbarkeit und lange Inhalte manuell prüfen |
| `/trainer/[slug]` | Fußball | öffentliches Trainerprofil | Coach-Repository, zentrale Medien; Coach-Profile-Komponenten | technisch; Route liegt außerhalb `/fussball`, fachlich dennoch Fußball |
| `/fussball/abteilung` | Fußball | Einstieg Vorstand/Trainer | statische Karten | technisch |
| `/fussball/abteilung/vorstand` | Fußball | öffentliche Fußballvorstände | Supabase `board_members`, zentrale Medien; Department-Komponenten | technisch; Public-Read-Minimierung bleibt separater Security-Folgepunkt |
| `/fussball/abteilung/trainer` | Fußball | öffentliche Trainerübersicht | Coach-Repository und Medien; Department-Komponenten | technisch |
| `/fussball/sponsoren` | Fußball | Sponsoren nach Kategorien | Supabase `sponsors`, `sponsor_categories`, zentrale Medien; Sponsor-Komponenten | technisch; Tabs und Logos manuell mobil prüfen |
| `/fussball/vereinsgeschichte` | Fußball | publizierte Chronik, Bilder und Meilensteine | drei `club_history_*`-Tabellen, zentrale Medien; `RichTextContent` | technisch; Benennung „Vereinsgeschichte“ wirkt gesamtvereinlich, Daten sind Fußball zugeordnet |
| `/tischtennis` | Tischtennis | Platzhalter | statischer Text | wahrscheinlich responsive; noch kein echter Inhalt, Training, Teams oder Kontakte |
| `/damen-gymnastik` | Gymnastikdamen | Platzhalter | statischer Text | wahrscheinlich responsive; noch kein echter Inhalt, Angebote, Zeiten oder Kontakte |
| `/impressum` | System/Rechtlich | publiziertes Impressum | Supabase `pages`; `RichTextContent` | technisch; fachliche/rechtliche Abnahme erforderlich |
| `/datenschutz` | System/Rechtlich | publizierter Datenschutz | Supabase `pages`; `RichTextContent` | technisch; fachliche/rechtliche Abnahme erforderlich |
| `/downloads/[id]/file` | Gesamtverein / Handler | kontrollierter PDF-Abruf | Download-Service, private Signed URL | kein UI; sicherheitsgehärteter 307/404/500-Vertrag |
| `/termine/[slug]/ics` | Gesamtverein / Handler | ICS-Kalenderdatei | Event-Service, Kalenderhelper | kein UI; dynamisch erzeugte Datei |

Verteilung der 30 Seiten: Gesamtverein 13, Fußball 13, Tischtennis 1, Gymnastikdamen 1, System/Rechtlich 2, Behindertensport 0, unklar 0. Dazu kommen zwei Gesamtvereins-Handler.

## Navigation: tatsächlicher IST-Stand

Desktop ab `md`:

- Startseite
- Verein → Tischtennis, Damen-Gymnastik
- Fußball → Mannschaften (Junioren, Senioren, Damen), Abteilung (Vorstand, Trainer), Sponsoren, Turniere/Events, Vereinsgeschichte
- News → Aktuelle Meldungen, News Übersicht
- Termine → Übersicht, Trainingstermine, allgemeine Termine
- Mitglied werden
- Kontakt

Mobile zeigt nur die sieben obersten Einträge. Untereinträge werden nicht dargestellt. Dropdowns öffnen am Desktop ausschließlich über Pointer-Hover; der Elternpunkt bleibt ein normaler Link.

### Navigationsbefunde

- Behindertensport fehlt vollständig.
- Gesamtverein und Abteilungen sind nicht sauber getrennt: Tischtennis und Gymnastik stehen unter „Verein“, Fußball parallel daneben.
- `/fussball/turniere-events`, `/fussball/turniere` und `/fussball/events` existieren nicht.
- Es gibt keine aktive Link-/Routenmarkierung.
- Desktop-Dropdowns besitzen keine buttonbasierte Tastatursteuerung, kein `aria-expanded`, keine Escape-/Außenklicklogik und kein Fokusmanagement.
- Mobile Untermenüs fehlen; das Menü besitzt weder Fokusfalle noch Escape-/Navigationswechselbehandlung.
- Die Bezeichnung „Vereinsgeschichte“ unter Fußball kann mit einer Gesamtvereinschronik verwechselt werden.

## Fachliche Zielarchitektur für B15.24B

Die endgültigen Menünamen und die konkrete Dropdowngeometrie bleiben offen. Fachlich benötigt die Navigation jedoch vier Ebenen:

1. **Gesamtverein**: Start, Verein/Profil, News, Termine, Kontakt, Mitglied werden, Downloads und rechtliche Einstiege.
2. **Abteilungen**: Fußball, Tischtennis, Behindertensport und Gymnastikdamen als gleichrangige Abteilungen.
3. **Abteilungsinhalte**: je nach tatsächlichem Bestand Mannschaften/Gruppen, Trainingszeiten, Ansprechpartner/Funktionen, News/Termine und Sponsoren.
4. **System/Rechtlich**: Impressum, Datenschutz und später nur tatsächlich implementierte Consent-/Cookie-Einstellungen.

Varianten für B15.24B: ein Hauptpunkt „Abteilungen“ mit vier Unterbereichen oder vier sichtbare Abteilungseinstiege bei ausreichendem Platz. Die Entscheidung muss Informationsdichte, Mobilnavigation, vorhandene Inhalte und die noch fehlenden Abteilungsseiten gemeinsam berücksichtigen.

## Header-IST und Handlungsbedarf

Der Header ist `fixed`, dunkel-transparent und blur-basiert. Das Logo ist eine hartcodierte öffentliche Supabase-Storage-URL, auf Desktop absolut positioniert und 160 Pixel groß. Vereinsclaim, Kurzname und Vereinsjahr stehen zusätzlich daneben. Die Navigation sitzt in derselben Zeile; Seiten kompensieren den festen Header mit uneinheitlichen `pt-28`, `pt-32`, `md:pt-52` oder `md:pt-56`.

Handlungsbedarf:

- Logo aus einer kontrollierten zentralen Quelle statt hartcodierter Storage-URL beziehen.
- feste Headerhöhe und ein gemeinsames Seiten-Offset definieren;
- Vereinsname als Gesamtverein klarer zeigen, ohne auf jeder Seite ein zusätzliches Header-`h1` zu erzeugen;
- Desktop/Tablet-Platzbedarf des großen Logos und der wachsenden Abteilungsnavigation lösen;
- Navigation tastatur- und fokusfähig machen;
- Kontraste, helle Zielwirkung und Sticky/Scroll-Verhalten nach Referenzdesign entscheiden;
- redundante Claim-/Namensinformationen und mobile Trunkierung prüfen.

## Footer-IST und Anforderungen

Der Footer lädt `club_settings` und veröffentlichte `pages` aus Supabase. Er zeigt Logo, Vereinsname, Beschreibung, Anschrift, E-Mail, Telefon sowie die drei Spalten Verein, Abteilungen und Rechtliches. Downloads sind verlinkt. Datenschutz und Impressum erscheinen nur bei publizierten CMS-Seiten. Social-Media-Links werden nicht ausgegeben.

Probleme und Anforderungen:

- Behindertensport fehlt; Mitglied werden ist fachlich keine Abteilung.
- Vereinsgeschichte verlinkt unmittelbar auf die Fußballchronik.
- „Cookie-Einstellungen“ zeigt nur auf `#` und besitzt keine Funktion.
- Logo ist erneut hartcodiert; Social-Media-Komponente existiert, wird im Footer aber nicht verwendet.
- Kontakt, Gesamtverein, Abteilungen und Rechtliches benötigen eine belastbare Informationshierarchie.
- Jugendschutz sollte nur bei vorhandener Route/Datenquelle gezielt verlinkt werden.
- Footer muss auf Mobilgeräten mit längeren Vereins-/Rechtstexten geprüft werden.
- Finale Vereins-/Impressumsangaben bleiben eine rechtliche Go-live-Abnahme, keine redaktionelle Eigenänderung.

## Öffentliches Designsystem: IST

Tailwind CSS 4 wird über `@import "tailwindcss"` verwendet. Globale Variablen existieren nur für Vereinsrot, Dunkel, Anthrazit, Hell und Weiß. Die eigentliche UI nutzt überwiegend direkt eingebettete Tailwind-Farben und Hexwerte; im öffentlichen Scope wurden 73 Zeilen mit hartcodierten Farbwerten gefunden.

Wiederkehrende Muster:

- fast durchgehend `#101014`/schwarze Hintergründe, weiße Transparenzen und rote Akzente;
- große, sehr schwere Überschriften und weit gesperrte uppercase Eyebrows;
- Karten mit `rounded-3xl`/`rounded-[2rem]`, `border-white/10`, `bg-white/5`;
- pillenförmige Buttons und Links;
- Maximalbreiten `max-w-5xl`/`max-w-7xl`;
- individuelle Seiten-Paddings statt gemeinsamer öffentlicher Page-/Hero-Komponente;
- Geist wird geladen, der Body überschreibt ihn jedoch mit Arial/Helvetica;
- Richtext besitzt ein separates dunkles Regelwerk; Football.de und das offenbar ungenutzte FuPa-System besitzen weitere eigene CSS-Tokens.

Konsistent sind Kartenform, Rotakzent, Abstände und Typografieabsicht. Inkonsistent sind Headerabstände, Herohöhen, Schriftgrößen, Farbquellen und Seitengerüste. `WebsiteLayout` existiert zusätzlich zum aktiven `(website)/layout.js`, wird aber nicht verwendet. `NewsCard.js` ist stark komprimiert und erschwert Wartung. Eine finale helle Palette wird erst nach Eingang der Referenzwebsite festgelegt.

## Responsive-/Mobile-IST

Die meisten Seiten verwenden `sm`-, `md`-, `lg`- und teilweise `xl`-Breakpoints, flexible Grids, `min-w-0`, `break-words` und responsive Paddings. News-Inline-Floats werden unter 640 Pixel auf volle Breite zurückgesetzt. Der Downloadbereich besitzt eine mobile Listenstruktur. Daraus folgt „technisch beziehungsweise wahrscheinlich responsive“, nicht „visuell abgenommen“.

Erkennbare Risiken:

- `body { overflow-x: hidden }` kann echtes Overflow verdecken.
- Mobile Navigation enthält keine Unterpunkte.
- Der feste Header, das große Desktoplogo und unterschiedliche Top-Paddings können Zwischenbreiten überdecken.
- Mannschaftsseiten kombinieren Hero, Tabs, Tabellen, externe Widgets und viele Karten.
- Football.de-Frames erzwingen mindestens 420 Pixel Höhe; Tabellenbreite und Fremdmarkup müssen real geprüft werden.
- lange Namen, Funktionsbezeichnungen, Kontaktangaben, Richtexte und Dokumenttitel benötigen Browsertests.
- große Bilder verwenden überwiegend natives `<img>`.
- Footer, Sponsor-Tabs, Eventaktionen und Profilkarten benötigen reale Touch-/Gerätetests.

## Fachlicher Inhaltsstand

### Gesamtverein

Vorhanden sind Startseite, vereinfachte Abteilungsauswahl, gemeinsame News, Termine, Kontakt, Mitgliedsanfrage, Downloads, Impressum und Datenschutz. Es fehlen ein echtes Gesamtvereinsprofil, eine klar zugeordnete Gesamtvereinsstruktur/Funktionärsseite, eine fachlich eindeutige Gesamtvereinsgeschichte und eine gleichrangige Darstellung aller vier Abteilungen.

### Fußball

Vorhanden sind Übersicht, Mannschaftsgruppen, dynamische Mannschafts- und Spielerprofile, Trainerprofile, Vorstand, Trainerverzeichnis, Sponsoren, Chronik, Trainingsdaten sowie Football.de-Spiele/Tabellen auf Mannschaftsebene. Nicht vorhanden sind die verlinkten Turnier-/Eventseiten. Ein eigener Fußball-Newsbereich oder ein klarer Abteilungsfilter für gemeinsame News/Termine ist nicht erkennbar.

### Tischtennis

Nur eine statische Platzhalterseite. Mannschaften/Gruppen, Trainingszeiten, Ansprechpartner, Termine, News und Medien fehlen.

### Behindertensport

Keine öffentliche Route, kein Navigationseintrag und kein Footerlink.

### Gymnastikdamen

Nur eine statische Platzhalterseite unter `/damen-gymnastik`. Angebote/Gruppen, Trainingszeiten, Ansprechpartner, Termine, News und Medien fehlen. Benennung und gewünschte URL-Konvention sind in B15.24B fachlich zu entscheiden, nicht in A umzubenennen.

## Datenquellen und Ownership

- **Supabase direkt/Repositories**: `news`, `events`, Kategorien/Typen, `pages`, `club_settings`, `club_contacts`, Teams/Saisons und saisonale Relationen, Spieler, Coaches, Board, Sponsoren/Kategorien sowie Chroniktabellen.
- **Zentrale Medienbibliothek**: News-/Eventbilder und -dokumente, Teams, Spieler, Trainer, Kontakte, Vorstand, Sponsoren, Chronik und Downloads. Header/Footer-Logo bilden eine Legacy-Ausnahme.
- **Server-only Downloadpfad**: Downloads, Kategorien, Media Asset/Usage und temporäre Signed URL.
- **Statisch im Code**: Verein-, Fußball-, Mannschafts-, Abteilungs- und Termin-Einstiegskarten sowie Tischtennis-/Gymnastik-Platzhalter und Navigation.
- **Externe Quellen**: Football.de-Widgets; Maps- und Kalenderlinks. Ein älteres FuPa-Komponentenset und dessen CSS sind vorhanden, aber im aktiven Mannschaftspfad nicht importiert.
- **Mehrfachpflege/Schichtvermischung**: öffentliche Seiten importieren teilweise Admin-Repositories und Admin-Media-Services; Navigation und Landingkarten pflegen dieselben Ziele separat; Logo steht doppelt als URL im Code.
- **Department Ownership**: Fußball ist strukturell weit ausgebaut. Für Tischtennis, Behindertensport und Gymnastik fehlen öffentliche Datenquellen/Ownership-Verträge. Datenbankänderungen dürfen erst in einem späteren eigenen Read-only-Preflight-/Proposalblock geplant werden.

## Accessibility, Performance und SEO

### Accessibility

- Links und Formularfelder sind überwiegend semantisch, Bilder besitzen im untersuchten Code grundsätzlich Altwerte.
- Der Header verwendet jedoch auf jeder Seite ein eigenes Marken-`h1`; Inhaltsseiten besitzen zusätzlich ein Seiten-`h1`.
- Dropdowns sind hovergesteuert und nicht als bedienbare Disclosure-Buttons mit `aria-expanded` umgesetzt.
- sichtbare `focus-visible`-Zustände fehlen weitgehend; viele Zustände sind nur `hover`.
- Mobile Menüführung enthält keine Untermenüs und kein Fokus-/Escape-Management.
- Kontrastrisiken bestehen bei `text-white/35`, `/40`, `/45` auf dunklen Flächen und müssen gemessen werden.
- Cookie-Link `#` ist ein nicht funktionsfähiges Bedienelement.

### Performance

- Der fokussierte ESLint-Lauf meldet 16 `no-img-element`-Warnungen und einen bestehenden `set-state-in-effect`-Fehler im Football.de-Widget.
- Nur der Team-Platzhalter verwendet `next/image`; Logo, News, Events, Personen, Teams und Sponsoren nutzen native Bilder.
- Geist und Geist Mono werden geladen, obwohl der Body Arial erzwingt.
- Startseite lädt bis zu 120 Events und expandiert Wiederholungen/Trainings für ein Jahr, bevor vier Einträge gezeigt werden.
- Mannschafts- und Eventdetailseiten bündeln viele Abfragen und Transformationsschritte in großen Route-Dateien.
- Football.de lädt Fremdskript/iframe; das ungenutzte FuPa-CSS wird global im Website-Layout importiert.
- Größte öffentliche Dateien: Eventdetail 255 Zeilen, Mannschaftsdetail 249, Membership-Formular 241, Trainingdetail 201 und Chronik 200.

### SEO

- Globale deutsche Sprache, Titel und Beschreibung sind im Rootlayout gesetzt.
- Nur `/downloads` besitzt eigene statische Metadata. Für News, Events, Mannschaften, Personen, Abteilungen und Rechtsseiten fehlen route-spezifische beziehungsweise dynamische Metadata.
- Keine Sitemap-, Robots-, Manifest-, OpenGraph- oder Twitter-Artefakte wurden im App-/Public-Bestand gefunden.
- Doppelte `h1`-Struktur durch Markenüberschrift und Seitenüberschrift sollte bereinigt werden.
- Abteilungszuordnung, Canonicals und Social Preview für dynamische Inhalte sind nicht dokumentiert.

## Rechtliche und Go-live-relevante Seiten

- Impressum und Datenschutz kommen publiziert aus dem CMS; Inhalte werden in B15.24 nicht eigenmächtig geändert.
- Kontakt ist vorhanden und kann Jugendschutzkontakte datengetrieben zeigen; eine dedizierte Jugendschutzdarstellung ist nicht vorhanden.
- Cookie-/Tracking-Einstellungen sind nicht implementiert, obwohl der Footerlink existiert.
- Downloads und Mitglied-werden sind funktional und sicherheitsgehärtet; Design-/Mobile- beziehungsweise Rechtsabnahmen bleiben offen.
- Tatsächlich eingesetzte externe Widgets, Maps-/Kalenderlinks und etwaige Tracking-/Consent-Auswirkungen sind vor Go-live rechtlich zu inventarisieren.

## Technische Altlasten

- tote Navigationsziele für Fußballturniere/-events;
- redundante `/news`- und `/news/uebersicht`-Einstiege ohne klar dokumentierte Rollen;
- ungenutztes `src/components/website/WebsiteLayout.js`;
- offenbar inaktives FuPa-Komponentenset plus global importiertes FuPa-CSS;
- öffentliche Schicht importiert mehrfach Admin-Repositories/-Services;
- stark komprimiertes `NewsCard.js` und mehrere große Route-Komponenten;
- keine TODO/FIXME-Treffer im öffentlichen Scope, aber dokumentierte Platzhaltertexte;
- fokussierte ESLint-Baseline: 1 Fehler und 16 Warnungen;
- keine automatisierte Linkprüfung; tote Links wurden statisch gefunden;
- Client Components sind auf Navigation, Membership, Teamtabs und externe Widgets begrenzt, aber deren Hydration-/Fokusverhalten muss im Browser geprüft werden.

## Abhängige B15.24-Unterblöcke

1. **B15.24A – COMPLETE:** Dokumentationskonsolidierung und vollständige IST-Analyse.
2. **B15.24B:** Gesamtvereins-Informationsarchitektur, Routenentscheidungen und barrierefreie Desktop-/Mobile-Navigation. Fehlende Datenquellen nur inventarisieren; DB-Bedarf löst eigenen Preflight aus.
3. **B15.24C:** Referenzdesign auswerten und zentrale öffentliche Designbasis festlegen; Tokens, Typografie, Flächen, Page-/Section-/Hero-Bausteine.
4. **B15.24D:** Header und globale Layoutgeometrie auf Basis von B/C.
5. **B15.24E:** Gesamtvereinsfooter, Kontakt-/Rechtlich-Hierarchie und nur tatsächlich vorhandene Links.
6. **B15.24F:** Gesamtvereinsseiten einschließlich Verein, News, Termine, Kontakt, Mitglied werden und Downloads vereinheitlichen.
7. **B15.24G:** Fußballbereich konsolidieren; tote Turnierlinks entscheiden, Mannschaften/Widgets/Profile/Chronik vereinheitlichen.
8. **B15.24H:** Tischtennis fachlich und technisch planen/integrieren.
9. **B15.24I:** Behindertensport fachlich und technisch planen/integrieren.
10. **B15.24J:** Gymnastikdamen fachlich und technisch planen/integrieren.
11. **B15.24K:** Responsive-/Mobile-Finalisierung mit realer Geräte-/Browsermatrix.
12. **B15.24L:** Accessibility, Performance und SEO; Metadata, Bilder, Fokus, Semantik und technische Altlasten.
13. **B15.24M:** Öffentliche fachliche/visuelle Abnahme. Infrastruktur-Go-live mit Domain, Echtdaten, Mailserver und Secrets bleibt davon getrennt.

## Nächster Schritt

B15.24B darf erst nach fachlicher Bestätigung der Gesamtvereinshierarchie und der gewünschten Navigationsvariante beginnen. Parallel benötigter offener Input für B15.24C ist die externe Referenzwebsite; sie bestimmt nicht Struktur, Texte, Navigation oder Markenauftritt.
