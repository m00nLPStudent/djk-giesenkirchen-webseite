# Project Health

Stand: **29. September 2026 · Version 1.0.13**

## Aktueller Stand

- Next.js App Router mit getrennter öffentlicher Website und geschütztem Adminbereich.
- Hetzner-Preproduction unter `djkvfl-test.de` mit reproduzierbarem GitHub-Actions-Deployment; der Node-Neustart bleibt ein manueller konsoleH-Schritt.
- All-Inkl-/DNS-Ausgangsbestand und Hetzner-Zielbetrieb für `djkvfl-giesenkirchen.de` sind analysiert. Die Hauptdomain ist noch nicht umgestellt; der private BIND-Export dient als Rollbackgrundlage.
- Der produktive Vereinsabsender über `mail.djkvfl-giesenkirchen.de` ist für Resend-Anwendungs-/Notification-Mails und Supabase-Auth-Mails eingerichtet und durch reale Notification-, Ticket- sowie Recovery-Zustellung bestätigt. Die Renderer-Abdeckung beträgt 30/30.
- Dashboardmodule für Settings/CMS, Membership, Notifications, News, Events, Downloads, Ergebnisse, Teams, Personen, Beiträge, Sponsoren, Medien, Chronik und Abteilungsverwaltung sind integriert.
- Öffentliche Gesamtvereins-, Fußball-, Tischtennis-, Behindertensport- und Gymnastikbereiche einschließlich responsive Designbasis, Consent, Accessibility-/SEO-Basis und zentralem E-Mail-Layout sind umgesetzt.
- Priority 7 hat die kontrollierte Testdatenbereinigung abgeschlossen. Die echte Vereinsdatenbefüllung läuft und ist noch nicht vollständig.
- Version 1.0.7 mit vertikalen Trainer-/Vorstandskarten ist live geprüft.
- Version 1.0.8 wurde mit öffentlichen Kontaktaktionen auf den Gesamtvorstandskarten begonnen.
- Versionen 1.0.9 bis 1.0.12 einschließlich Ergebnisverwaltung/-ticker sowie der gehärteten Trainer-, Jugendleiter-, Tischtennisvorstand- und Kassierer-Verträge sind deployed und live geprüft.
- Version 1.0.13 schließt das Support-/Ticketsystem einschließlich Rollen-Livetest, Dashboard-Notifications, kontrollierter Mailtyp-Aktivierung, realer Zustellung und CTA-Prüfung ab.
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

- Der Pre-Go-live-Komplettcheck ist abgeschlossen: 7.1 bis 7.8 sind erfolgreich geprüft beziehungsweise für den Go-live freigegeben, und der technische Repository-Audit 7.9 fand keinen neuen Produktcode-Go-live-Blocker. Bekannte Baseline-Test-/ESLint-Probleme bleiben separat dokumentiert; die offenen Cutover-Arbeiten folgen unter den Roadmap-Punkten 8 ff. Unvollständiger Behindertensport-Content und kleinere Inhalts-/Rollendetails sind keine Cutover-Blocker.
- Hetzner-Cutover-Konfiguration für Node.js 24, `app.js`, Working Directory, 384 MB, fehlende Script-Parameter, Varnish aus, `NEXT_PUBLIC_SITE_URL=https://djkvfl-giesenkirchen.de` und den bestehenden `MAIL_FROM`-Vertrag erneut setzen beziehungsweise prüfen.
- Finale DNS-Umschaltung, SSL-Aktivierung, Supabase Site URL und produktive Indexierung in der kontrollierten Cutover-Reihenfolge durchführen. `djkvfl-test.de` bleibt bis dahin bestehen; `new.djkvfl-giesenkirchen.de` ist kein Ziel.
- Finale Legal-/Providerprüfung sowie Mail-/Auth-Linksmokes mit der echten Produktivdomain; der produktive Mailabsender selbst ist bereits live getestet.
- Contribution-Reminder kontrolliert produktiv aktivieren.
- Abschließender Desktop-/Tablet-/Mobile-Gesamtsmoke auf der finalen Domain.

Die verbindliche Reihenfolge und optionale Folgepunkte stehen in der [aktuellen Roadmap](../planning/current-roadmap.md). Deploymentdetails verbleiben ausschließlich in [deployment.md](deployment.md).
