# B15.24M – Cookie, Consent & DSGVO: technischer Vertrag

Status: **COMPLETE – MANUAL CONSENT REVIEW PASSED**

Dieser Vertrag beschreibt den technisch nachgewiesenen Stand. Er ist keine juristische Vollgarantie. Anbieter-, Rechtsgrundlagen- und Betreibertexte müssen vor Go-live rechtlich geprüft werden.

## Tatsächliches Storage-Inventar

| Speicher | Bereich | Zweck | Einordnung | Lebensdauer |
| --- | --- | --- | --- | --- |
| `djk-vfl-giesenkirchen-consent` in `localStorage` | öffentlich | Consent-Version, `necessary`, `externalMedia`, Änderungszeitpunkt | technisch notwendig | bis Browserdaten gelöscht oder Version ungültig wird |
| Supabase SSR/Auth-Cookies | Login/Admin | Session, Authentifizierung und Sicherheitsabläufe | technisch notwendig | durch Supabase/Sessionvertrag bestimmt |
| Prüfung von Supabase-Auth-Keys in `localStorage`/Cookies im Login | Admin | Erkennen einer bereits vorhandenen Sitzung | technisch notwendig | nur bestehender Auth-Vertrag; B15.24M setzt dort nichts neu |

Keine produktive Verwendung von `sessionStorage` oder IndexedDB wurde gefunden. Consent enthält keine Nutzer-ID und wird nicht in der Datenbank gespeichert. Ungültige, zu große, beschädigte oder versionsfremde Werte gelten als nicht erteilte Entscheidung.

## Third-Party-Inventar und Kategorien

Es gibt nur zwei Kategorien:

- **Technisch notwendig** (immer aktiv): Consent-Speicherung sowie Auth-/Session- und Sicherheitsfunktionen.
- **Externe Inhalte** (standardmäßig aus): eingebettete Inhalte von FUSSBALL.DE und eine gegebenenfalls konfigurierte Google-Maps-Karte.

Nicht vorhandene Statistik-, Marketing- oder Personalisierungsdienste erhalten keine erfundene Kategorie.

- **FUSSBALL.DE:** `https://www.fussball.de/widgets.js` und das daraus erzeugte Cross-Origin-iframe werden erst bei `externalMedia = true` erzeugt. Vorher erscheint ein lokaler Placeholder. Die Einzelfreigabe setzt die gesamte Kategorie. Widerruf unmountet die Widgets; der bestehende Lifecycle entfernt Widget-DOM und Script. Ein kontrollierter Reload ist für den manuellen Network-Nachtest vorgesehen.
- **click-TT/myTischtennis:** ausschließlich serverseitiger, allowlist-validierter Abruf; an den Browser gehen normalisierte Sportdaten. Kein Provider-Script und kein Provider-iframe im Browser. Daher kein Consent-Gating. Der Quellenlink ist ein normaler externer Link.
- **Google Maps:** normale externe Links werden nicht vorab geladen und benötigen kein Embed-Gating. Ein nur bei vorhandener Serverkonfiguration erzeugtes Embed wird bis zur Kategorieeinwilligung blockiert.
- **Social Media:** ausschließlich validierte normale externe Links; keine Plugins, SDKs oder Embeds gefunden.
- **Supabase:** Public-Datenabrufe und Storage gehören zur Websitefunktion; Auth-Cookies/Sessions sind technisch notwendig und werden nicht von optionalem Consent abhängig gemacht.
- **Sonstige:** keine Analytics-, Tag-Manager-, Captcha-, Video-, externe Font-CDN- oder Trackingintegration gefunden.

Im Repository liegen außerdem ältere, exportierte FuPa- und generische Football-Embed-Komponenten. Für sie wurde kein Import in eine aktuelle Route oder Produktkomponente gefunden; sie erzeugen im aktuellen Websitepfad daher keinen Browserrequest. Vor einer späteren Reaktivierung müssten sie ebenfalls an das Gate „Externe Inhalte“ angebunden werden.

## Consent- und Interaktionsvertrag

`CONSENT_VERSION = "1"`; Storage-Key ist `djk-vfl-giesenkirchen-consent`. Gespeichert werden ausschließlich Version, notwendige Kategorie, externe Inhalte und ISO-Zeitpunkt. Bei fehlendem oder ungültigem Wert beziehungsweise Versionswechsel erscheint erneut die erste Ebene. Optionales ist nie voraktiviert.

Die erste Ebene bietet gleichwertig „Alle akzeptieren“, „Nur notwendige“ und „Einstellungen“ sowie Datenschutz und Impressum. Escape beim verpflichtenden Erstbesuch entspricht „Nur notwendige“ und speichert diese Entscheidung. Im später freiwillig geöffneten Einstellungsdialog schließt Escape ohne Änderung. Der Dialog besitzt Modal-Semantik, initialen Fokus und eine Tab-/Shift-Tab-Fokusfalle. Der öffentliche Footer und `/cookie-einstellungen` öffnen dieselbe zentrale Einstellung. Der Adminbereich liegt bewusst außerhalb des Public-Consent-Providers.

## Datenschutz- und Rechtsseitenstatus

`/datenschutz` enthält zusätzlich eine technische Beschreibung des nachgewiesenen Verhaltens. `/impressum` und `/datenschutz` bleiben ohne Einwilligung erreichbar. Das vorhandene redaktionelle Impressum wird nicht erfunden oder überschrieben.

**OPERATOR LEGAL CONTENT REQUIRED:** Vor Go-live sind Verantwortlicher/Vertretung, vollständige Kontakt- und Impressumsangaben, belastbare Rechtsgrundlagen, Anbieterinformationen und gegebenenfalls Drittland-/Aufbewahrungshinweise fachjuristisch zu prüfen und redaktionell zu vervollständigen. Keine ungeprüften Anschriften, Fristen oder Garantien wurden ergänzt.

## Manueller Abnahmeplan

1. DevTools → Network leeren, Storage-Key entfernen, Seite mit FUSSBALL.DE-Widget neu laden: kein Request an `fussball.de` oder `next.fussball.de`, lokaler Placeholder sichtbar.
2. „FUSSBALL.DE-Inhalt erlauben“ einmal wählen: Consent gespeichert, Script/iframe und Widget sichtbar; Tabelle, Spielplan, Multi-Team und A → B → A ohne Duplikate prüfen.
3. Footer → Cookie-Einstellungen → externe Inhalte deaktivieren → speichern → neu laden: Placeholder wieder sichtbar und keine Widgetrequests.
4. DevTools → Application → Local Storage: Key, Version `1`, Kategorien und Zeitpunkt prüfen; ohne Zustimmung darf `externalMedia` nicht `true` sein.
5. First Visit, Reload, Navigation und neuer Tab; danach Tab, Shift+Tab, Enter, Space, Escape, 200-%-Zoom sowie 360/390/430 px prüfen.
6. Falls Google Maps Embed später konfiguriert wird: vor Consent kein Google-iframe, normaler externer Link weiterhin nutzbar, Embed erst nach Zustimmung.

Staging-Noindex und Production-Indexierung aus B15.24L bleiben unabhängig. Localhost, Tunnel, Staging und Produktion benötigen keine hardcodierte Domain.

## Manueller Abschluss und Pre-Go-live-Gate

Der Betreiber hat First Visit, alle drei Auswahlwege, Persistenz, erneutes Öffnen über den Footer, FUSSBALL.DE-Placeholder, Freigabe und Widerruf, Tastaturbedienung, Fokus, Mobile sowie 200-%-Zoom erfolgreich geprüft. Im Browser-Storage wurden der Key `djk-vfl-giesenkirchen-consent`, Version `1`, `necessary = true`, `externalMedia = false` und ein vorhandener Zeitstempel bestätigt. Vor Zustimmung entstand kein automatischer FUSSBALL.DE-Widgetrequest; nach Zustimmung waren Widgetrequests zulässig und nach Widerruf wieder blockiert.

**IMMEDIATELY BEFORE GO-LIVE / LEGAL CONTENT PRE-GO-LIVE GATE:**

- Testdatenbereinigung abschließen und Echtdaten einpflegen.
- Impressum und Datenschutzerklärung vollständig befüllen und manuell gegenlesen.
- Betreiber-, Vertretungs-, Hosting-, Domain- und Kontaktangaben final eintragen und prüfen.
- Rechtsgrundlagen und anbieterbezogene Pflichtinformationen fachlich prüfen.
- Consent-Texte und Dienstinventar gegen den finalen Technik- und Deploymentstand erneut abgleichen.

B15.24M ist technisch abgeschlossen. Dieser Abschluss erklärt die noch offenen juristischen Inhalte ausdrücklich nicht für fertig.
