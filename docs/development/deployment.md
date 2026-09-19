# Deployment

Deployment-bezogene Hinweise.

## Grundsatz

- Deployments nur auf konsistentem Schema-, Service- und UI-Stand.
- Keine geheimen Tokens oder Zugangsdaten in Dokumente übernehmen.
- Vor Deployment immer `npm.cmd run build` erfolgreich ausführen.

## Hetzner Webhosting L: halbautomatisches Preproduction-Deployment

Die produktionsnahe Abnahmeversion läuft auf `djkvfl-test.de`. Ein Push auf
`master` startet den Workflow `.github/workflows/deploy-hetzner.yml`. Der
Workflow deployt ausschließlich den konkreten Push-Commit und führt keinen
Datenbank- oder SQL-Schritt aus.

### Ablauf

1. Änderungen lokal entwickeln.
2. Anwendung unter `localhost` fachlich prüfen.
3. Relevante Tests, ESLint, Build und `git diff --check` lokal ausführen.
4. Änderungen bewusst committen und auf `master` pushen.
5. GitHub Actions stellt eine host-key-verifizierte SSH-Verbindung zum
   Hetzner-Webhosting her.
6. `scripts/deploy-hetzner.sh` prüft Branch, Remote, Zielcommit und den
   versionierten Serverzustand.
7. Der exakte Commit wird zunächst in einem isolierten Git-Worktree gebaut.
8. Erst nach erfolgreichem Build werden das Serverrepository, erforderliche
   Dependencies und `.next` auf diesen Stand gesetzt.
9. Der Workflow meldet ausdrücklich:

   ```text
   BUILD ERFOLGREICH
   MANUELLER NODE.JS-NEUSTART IN KONSOLEH ERFORDERLICH
   ```

10. In konsoleH unter **Node.js-Konfiguration** die Anwendung manuell neu
    starten.
11. Anschließend `https://djkvfl-test.de` und die zentralen öffentlichen sowie
    geschützten Routen manuell prüfen.

Der Workflow behauptet vor dem manuellen Neustart nicht, dass der neue Commit
bereits live ist. Ein Live-Healthcheck ist daher noch kein automatischer
Deploymentbestandteil.

### Serverseitige `app.js` und Environment-Dateien

Die von Hetzner verwendete `app.js` existiert ausschließlich im
Serverrepository und bleibt unversioniert. Das Deploymentskript prüft ihre
Existenz, löscht, verschiebt oder überschreibt sie aber nicht. Ein Zielcommit,
der selbst eine `app.js` enthält, wird abgewiesen.

Vorhandene `.env`, `.env.local`, `.env.production` und
`.env.production.local` werden niemals verändert oder übertragen. Für den
isolierten Build werden vorhandene Dateien lediglich temporär per Symlink in
den Build-Worktree eingebunden. Die Symlinks werden mit dem Worktree entfernt.

### Benötigte GitHub-Secrets

Im GitHub-Repository werden unter **Settings → Secrets and variables →
Actions** folgende Repository-Secrets benötigt:

- `HETZNER_SSH_HOST`: SSH-Hostname des Webhostings.
- `HETZNER_SSH_PORT`: SSH-Port, bei konsoleH-Webhosting üblicherweise `222`.
- `HETZNER_SSH_USER`: SSH-fähiger Hauptbenutzer des Accounts.
- `HETZNER_SSH_PRIVATE_KEY`: ausschließlich für dieses Deployment erzeugter
  privater SSH-Schlüssel.
- `HETZNER_SSH_HOST_KEY`: vorab unabhängig verifizierte vollständige
  `known_hosts`-Zeile für `[Host]:Port`; nicht erst im Workflow per
  `ssh-keyscan` vertrauen.
- `HETZNER_DEPLOY_PATH`: absoluter Pfad oder
  `~/djk-giesenkirchen-webseite`.

Anwendungssecrets, Supabase-Schlüssel und Provider-Zugangsdaten gehören nicht
in den Workflow. Sie verbleiben in der bestehenden Hetzner-Konfiguration.

### Dependency-Vertrag

`package-lock.json` ist maßgeblich. Wenn `package.json` oder
`package-lock.json` seit dem aktuell deployten Commit verändert wurden oder
`node_modules` fehlt, führt das Skript im isolierten Worktree `npm ci` aus.
Andernfalls wird das vorhandene `node_modules` ausschließlich für den Build
wiederverwendet. Erst nach erfolgreichem Build wird ein neu installiertes
Dependency-Verzeichnis aktiviert.

### Sicherheits- und Fehlerverhalten

- Nur Pushes auf `master` lösen das Deployment aus; Pull Requests nicht.
- GitHub-Concurrency verhindert parallele Workflow-Deployments.
- Eine zusätzliche serverseitige Sperre verhindert Überschneidungen mit
  anderen Deployments.
- Der SSH-Host-Key wird strikt geprüft; `StrictHostKeyChecking=no` ist
  verboten.
- Unerwartete Änderungen an versionierten Serverdateien führen zum Abbruch.
- Unversionierte Dateien werden weder bereinigt noch pauschal gelöscht; es
  gibt kein `git clean`.
- Nur ein Fast-Forward von `master` auf exakt den gepushten Commit ist erlaubt.
- Der Production-Build läuft vor der Aktivierung in einem getrennten Worktree.
- Bei einem fehlgeschlagenen isolierten Build bleiben Git-HEAD, aktive
  Dependencies und aktive `.next`-Ausgabe unverändert.
- Es gibt keinen Prozess-Kill, keinen PM2-, systemd-, Docker- oder
  undokumentierten Hetzner-Restart.
- Deploymentlogs enthalten ausschließlich Zeitpunkt, Phase und Commit-ID. Das
  Skript aktiviert kein Shell-Tracing und gibt keine Environmentwerte aus.
- Supabase-Migrationen, SQL und sonstige Datenbankänderungen sind ausdrücklich
  nicht Bestandteil des Deployments.

### Fehlerbehebung

- **SSH schlägt fehl:** Secret-Namen, Port, Benutzer, dedizierten Public Key in
  konsoleH und die unabhängig verifizierte `known_hosts`-Zeile prüfen.
- **Deployment-Sperre bleibt nach einem abgebrochenen Prozess bestehen:**
  Zuerst sicherstellen, dass kein Deployment mehr läuft. Erst danach das
  Verzeichnis `~/.cache/djkvfl-hetzner-deploy.lock` manuell entfernen.
- **Tracked Working Tree nicht sauber:** Änderungen auf dem Server nicht
  überschreiben. Ursache inventarisieren und bewusst sichern oder übernehmen.
- **Kein Fast-Forward:** Serverstand und `origin/master` untersuchen; niemals
  ungeprüft resetten oder force-pushen.
- **`npm ci` oder Build schlägt fehl:** Der Workflow stoppt vor der
  Aktivierung. Fehler im GitHub-Log beziehungsweise in
  `~/.local/state/djkvfl-hetzner-deployments.log` prüfen, lokal korrigieren und
  einen neuen Commit pushen.
- **Build erfolgreich, Seite unverändert:** Der vorgeschriebene manuelle
  Node.js-Neustart in konsoleH fehlt noch.

### Rollback-Grundprinzip

Das vorherige `.next`-Verzeichnis und bei Dependencyänderungen das vorherige
`node_modules` bleiben zunächst als `.next.deploy-previous` beziehungsweise
`node_modules.deploy-previous` erhalten. Ein Rollback wird nicht automatisch
und nicht durch einen ungeprüften Hard Reset ausgeführt. Zuerst wird der letzte
bekannt funktionierende Commit ermittelt. Danach werden Repositorystand,
Dependencies und Build kontrolliert auf diesen Commit zurückgeführt und die
Node.js-Anwendung manuell neu gestartet. Ein Rollback enthält ebenfalls niemals
SQL- oder Datenbankänderungen.

## Admin-Einladung und Passwort-Setup

Benötigte Variablen in `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://<current-tunnel-or-production-domain>
```

Hinweise:

- `SUPABASE_SERVICE_ROLE_KEY` niemals als `NEXT_PUBLIC_` definieren.
- `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig verwenden.
- Bei neuem Quick Tunnel ändert sich die URL. Danach müssen aktualisiert werden:
  - `NEXT_PUBLIC_SITE_URL`
  - Supabase Redirect URL Allowlist
  - laufender Dev-Server (neu starten)

## Supabase Auth Redirects

Browsergestützte Passwort-Recovery verwendet die tatsächlich aufgerufene,
streng validierte Origin. In Supabase muss diese Origin trotzdem ausdrücklich
zugelassen sein:

- **Authentication → URL Configuration → Site URL**: kontrolliert auf die
  primäre aktuelle Deployment- beziehungsweise spätere Produktivdomain setzen.
- **Authentication → URL Configuration → Redirect URLs**: die exakt erzeugte
  Recovery-URL
  `https://<current-tunnel-or-production-domain>/admin/auth/callback?next=%2Fadmin%2Fset-password`
  erlauben.
- Für lokale Tests zusätzlich
  `http://localhost:3000/admin/auth/callback?next=%2Fadmin%2Fset-password`
  als Redirect URL erlauben.

Vorhandene Werte zuerst inventarisieren; keine produktive Site URL oder andere
Redirects ungeprüft überschreiben. Quick-Tunnel-Domains ändern sich und gehören
nicht hartcodiert in den Produktcode.

Falls eine Recovery-Mail trotz korrekt übergebenem und erlaubtem `redirectTo`
weiterhin direkt die `Site URL` verwendet, im bestehenden Recovery-Mailtemplate
zusätzlich prüfen, ob dessen Link `{{ .RedirectTo }}` statt einer hartcodierten
URL beziehungsweise `{{ .SiteURL }}` verwendet. Das Template nicht ungeprüft
überschreiben, da Invite- und andere Auth-Mailtemplates getrennte Verträge haben.
