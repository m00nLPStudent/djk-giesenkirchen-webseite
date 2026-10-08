# Project Health

Stand: **8. Oktober 2026 · Version 1.0.13 · PRODUKTIV / LIVE**

## Aktueller Stand

- Next.js App Router mit getrennter öffentlicher Website und geschütztem Adminbereich.
- Produktivbetrieb unter `https://djkvfl-giesenkirchen.de` auf Hetzner mit reproduzierbarem GitHub-Actions-Deployment; der Node-Neustart bleibt ein manueller konsoleH-Schritt.
- Hauptdomain und Wildcard zeigen auf Hetzner. Der private BIND-Ausgangsbestand bleibt Rollbackgrundlage; mail-relevante DNS-Einträge wurden beim Cutover nicht verändert.
- Der produktive Vereinsabsender über `mail.djkvfl-giesenkirchen.de` ist für Resend-Anwendungs-/Notification-Mails und Supabase-Auth-Mails eingerichtet und durch reale Notification-, Ticket- sowie Recovery-Zustellung bestätigt. Die Renderer-Abdeckung beträgt 30/30.
- Dashboardmodule für Settings/CMS, Membership, Notifications, News, Events, Downloads, Ergebnisse, Teams, Personen, Beiträge, Sponsoren, Medien, Chronik und Abteilungsverwaltung sind integriert.
- Öffentliche Gesamtvereins-, Fußball-, Tischtennis-, Behindertensport- und Gymnastikbereiche einschließlich responsive Designbasis, Consent, Accessibility-/SEO-Basis und zentralem E-Mail-Layout sind umgesetzt.
- Priority 7 hat die kontrollierte Testdatenbereinigung abgeschlossen. Der für den Go-live erforderliche Echtdatenbestand ist vorhanden; Behindertensport und kleinere redaktionelle Inhalts-/Rollendetails sind noch nicht vollständig.
- Version 1.0.7 mit vertikalen Trainer-/Vorstandskarten ist live geprüft.
- Version 1.0.8 wurde mit öffentlichen Kontaktaktionen auf den Gesamtvorstandskarten begonnen.
- Versionen 1.0.9 bis 1.0.12 einschließlich Ergebnisverwaltung/-ticker sowie der gehärteten Trainer-, Jugendleiter-, Tischtennisvorstand- und Kassierer-Verträge sind deployed und live geprüft.
- Version 1.0.13 schließt das Support-/Ticketsystem einschließlich Rollen-Livetest, Dashboard-Notifications, kontrollierter Mailtyp-Aktivierung, realer Zustellung und CTA-Prüfung ab.
- Nach Version 1.0.13 sind Support als eigener letzter Dashboard-Hauptpunkt, die Berlin-basierte Begrüßungs-/Uhrlogik und die präzisierte Spieler-/Mannschaftszuordnung einschließlich `Ohne Mannschaft`, Statusfiltern und deaktivierbaren saisonalen Relationen umgesetzt und automatisiert geprüft. Eine neue Releaseversion wurde dafür nicht angelegt.
- Das öffentliche Repositoryasset `public/images/bimi-logo.svg` ist vorhanden. BIMI-DNS und Erreichbarkeit wurden vom Betreiber extern bestätigt; Mailclient-Anzeige und Zertifikatsfragen sind kein Anwendungscodevertrag.
- Die server-only myTischtennis-/click-TT-Competition-Integration ist wieder funktionsfähig. Der zeitweise Hetzner-Providerfehler (`/verify`, HTTP `429`) ist kein aktueller Blocker; der bestehende Revalidate-Vertrag beträgt 15 Minuten. Ein [WTTV-Fallback](../planning/table-tennis-competition-provider-fallback.md) wird nur bei einem erneut wiederholten oder dauerhaften Ausfall reaktiviert.

## Architekturregeln

- Privilegierte Mutationen prüfen Session, Permission und Fachscope, bevor ein serverseitiger Admin-Client verwendet wird.
- Direkte Browser-Schreibpfade auf gehärtete Fach- und Medientabellen dürfen nicht wieder eingeführt werden.
- Datenbankänderungen werden ausschließlich über Read-only Preflight, geprüftes Proposal, Rollback-Artefakt und Read-only Postcheck vorbereitet; Deployments führen kein SQL aus.
- Statische Inhalte und Providerintegrationen bleiben fail-closed, server-only und nach Abteilung beziehungsweise Organisationsscope getrennt.

## Qualität

- Release 1.0.12: fokussierte Editorial-/Scope-/Permission-Regressionen, Changed-Scope ESLint, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Sensitive-Data-Check bestanden. Ausschließlich die bekannte Roadmap-Baseline zu `GOOGLE_MAPS_EMBED_API_KEY` bleibt rot.

- Release 1.0.11: fokussierte Jugendleiter-, Results-, Team-Season-, Trainer-, Permission- und Scope-Regressionen, Changed-Scope ESLint, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Sensitive-Data-Check bestanden. Die bekannte, unabhängige Roadmap-Baseline zu `GOOGLE_MAPS_EMBED_API_KEY` bleibt der einzige rote Gesamttest.
- Release 1.0.10: fokussierte Team-/Trainer-/Scope-Regressionen, Changed-Scope ESLint, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Sensitive-Data-Check bestanden. Die bekannte, unabhängige Roadmap-Baseline zu `GOOGLE_MAPS_EMBED_API_KEY` bleibt der einzige rote Gesamttest.
- Release 1.0.9: 1457/1458 Tests bestanden; allein die bekannte, unabhängige Roadmap-Baseline zur Zeichenfolge `GOOGLE_MAPS_EMBED_API_KEY` bleibt rot. Changed-Scope ESLint ohne Fehler, TypeScript, Production Build, Admin-Route-Audit und `git diff --check` sind bestanden.
- Release 1.0.7: 1412/1412 Tests, Changed-Scope ESLint ohne Fehler, TypeScript, Production Build, Admin-Route-Audit, `git diff --check` und Secret-Check bestanden.
- Bestehende `no-img-element`-Warnungen sind dokumentierter optionaler Bildoptimierungsbedarf.
- Keine aktuell bekannte Test-, Build- oder TypeScript-Regression.

## Offene Gesundheits- und Go-live-Punkte

- Pre-Go-live-Komplettcheck, DNS-Cutover, SSL, Supabase Site URL, produktive Mail-/Auth-Links, FUSSBALL.DE und finaler geräteübergreifender Live-Smoke sind abgeschlossen. Es besteht kein bekannter Go-live-blockierender Fehler.
- Node.js 24, `app.js`, Working Directory, 384 MB, keine Script-Parameter, Varnish aus, `NEXT_PUBLIC_SITE_URL=https://djkvfl-giesenkirchen.de` und der bestehende `MAIL_FROM`-Vertrag sind produktiv aktiv.
- Die öffentliche Suchmaschinenindexierung ist kontrolliert freigegeben. `PUBLIC_SITE_INDEXING_ENABLED=true` ist produktiv build-sichtbar aktiv; `robots.txt`, die nicht leere Produktiv-Sitemap und der Wegfall von `noindex` auf der Startseite wurden live geprüft. `/admin/`, `/api/` und `/auth/` bleiben für Crawler gesperrt. Production-Build und manueller Node-Neustart sind erfolgreich abgeschlossen.
- Contribution-Reminder erst nach eingerichtetem Kassiererzugang, vollständigen kontrollierten Echtdaten und vollständiger Aktivierungscheckliste produktiv aktivieren.
- Vier eingerichtete Majordomo-Verteiler für Fußball, Fußballvorstand, Trainer und Tischtennis noch kontrolliert im Echtbetrieb abnehmen. Nur der Gesamtvereinsverteiler ist extern bereits als erfolgreich getestet gemeldet.
- Redaktionelle beziehungsweise juristische Feinprüfungen und die verbleibende Content-Nachpflege fortführen. Google Maps Inline/Embed bleibt ohne `GOOGLE_MAPS_EMBED_API_KEY` und kontrollierten Consent-/Go-live-Test optional inaktiv.
- Die extern bestätigte ALL-INKL-Postfach-, Weiterleitungs-, Signatur-, SPF-, DKIM-, DMARC- und BIMI-Konfiguration ist vom produktiven Resend-/Supabase-Mailtransport der Website unabhängig. Zugangsdaten und Konfigurationswerte verbleiben außerhalb des Repositorys.

Die verbindliche Reihenfolge und optionale Folgepunkte stehen in der [aktuellen Roadmap](../planning/current-roadmap.md). Deploymentdetails verbleiben ausschließlich in [deployment.md](deployment.md).
