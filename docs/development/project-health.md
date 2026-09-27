# Project Health

Stand: **27. September 2026 · Version 1.0.12**

## Aktueller Stand

- Next.js App Router mit getrennter öffentlicher Website und geschütztem Adminbereich.
- Hetzner-Preproduction unter `djkvfl-test.de` mit reproduzierbarem GitHub-Actions-Deployment; der Node-Neustart bleibt ein manueller konsoleH-Schritt.
- Dashboardmodule für Settings/CMS, Membership, Notifications, News, Events, Downloads, Ergebnisse, Teams, Personen, Beiträge, Sponsoren, Medien, Chronik und Abteilungsverwaltung sind integriert.
- Öffentliche Gesamtvereins-, Fußball-, Tischtennis-, Behindertensport- und Gymnastikbereiche einschließlich responsive Designbasis, Consent, Accessibility-/SEO-Basis und zentralem E-Mail-Layout sind umgesetzt.
- Priority 7 hat die kontrollierte Testdatenbereinigung abgeschlossen. Die echte Vereinsdatenbefüllung läuft und ist noch nicht vollständig.
- Version 1.0.7 mit vertikalen Trainer-/Vorstandskarten ist live geprüft.
- Version 1.0.8 wurde mit öffentlichen Kontaktaktionen auf den Gesamtvorstandskarten begonnen.
- Version 1.0.9 ergänzt die zentrale Ergebnisverwaltung und den öffentlichen, routenabhängigen Header-Ticker. Core-, Integrations-, Motion- und Accessibility-Verträge sind automatisiert validiert; Dashboard und responsive Tickeransicht sind manuell abgenommen. Deployment, manueller Node-Neustart und Livekontrolle stehen noch aus.
- Version 1.0.10 führt einen serverseitig erzwungenen Mannschaftsscope für Trainer ein. Beschreibung, Training, Kader und Kontakt der zugeordneten Mannschaften sind freigegeben; strukturelle, mediale und wettbewerbsbezogene Mutationen bleiben gesperrt. Das DB-Hardening ist postcheck-bestätigt, Deployment und Live-Rollentest stehen noch aus.
- Version 1.0.11 begrenzt die neue vollständige Ergebnisverwaltung des Jugendleiters auf Fußball, entzieht allgemeine Einstellungen und erhält den fehlenden `teams.create`-Vertrag. Bestehende Team-Seasons werden per UPDATE, neue nur nach Create-Prüfung per INSERT gespeichert. Der DB-Postcheck ist mit `overall_ok = true` bestanden; Deployment und Live-Rollentest stehen noch aus.
- Version 1.0.12 begrenzt News und allgemeine Termine des Tischtennisvorstands zentral und serverseitig auf Tischtennis. Der Kassierer behält alle neun Beitragsrechte, während der allgemeine Settings-Zugriff entfällt. Der DB-Postcheck ist mit 10/10 Blöcken und `overall_ok = true` bestanden; Deployment und Live-Rollentest stehen noch aus.
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

- Echtdaten-/Contentbefüllung vervollständigen.
- Finale Domain-, Environment-, Indexierungs- und Supabase-Redirect-Konfiguration.
- Finale Legal-/Provider- sowie Mail-/Auth-Prüfung.
- Contribution-Reminder kontrolliert produktiv aktivieren.
- Abschließender Desktop-/Tablet-/Mobile-Gesamtsmoke auf der finalen Domain.

Die verbindliche Reihenfolge und optionale Folgepunkte stehen in der [aktuellen Roadmap](../planning/current-roadmap.md). Deploymentdetails verbleiben ausschließlich in [deployment.md](deployment.md).
