#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

EXPECTED_COMMIT="${1:-}"
DEPLOY_PATH_BASE64="${DEPLOY_PATH_BASE64:-}"
REPOSITORY_PATH=""
STAGING_PATH=""
LOCK_PATH=""
LOG_FILE=""

fail() {
  printf 'DEPLOYMENT FEHLGESCHLAGEN: %s\n' "$1" >&2
  exit 1
}

cleanup() {
  local exit_code=$?

  if [[ -n "$STAGING_PATH" && -d "$STAGING_PATH" ]]; then
    if [[ -n "$REPOSITORY_PATH" ]]; then
      git -C "$REPOSITORY_PATH" worktree remove --force "$STAGING_PATH" >/dev/null 2>&1 || true
    fi
    rm -rf -- "$STAGING_PATH"
  fi

  if [[ -n "$LOCK_PATH" && -d "$LOCK_PATH" ]]; then
    rmdir -- "$LOCK_PATH" >/dev/null 2>&1 || true
  fi

  exit "$exit_code"
}

trap cleanup EXIT

[[ "$EXPECTED_COMMIT" =~ ^[0-9a-f]{40}$ ]] || fail "Ungültiger Zielcommit"
[[ -n "$DEPLOY_PATH_BASE64" ]] || fail "Deploymentpfad fehlt"

for command_name in base64 git node npm mktemp sed stat; do
  command -v "$command_name" >/dev/null 2>&1 || fail "Benötigtes Kommando fehlt: $command_name"
done

raw_deploy_path="$(printf '%s' "$DEPLOY_PATH_BASE64" | base64 --decode)" || fail "Deploymentpfad ist ungültig"
case "$raw_deploy_path" in
  "~/"*) raw_deploy_path="$HOME/${raw_deploy_path#\~/}" ;;
esac

[[ "$raw_deploy_path" == /* ]] || fail "Deploymentpfad muss absolut oder mit ~/ angegeben werden"
[[ -d "$raw_deploy_path" ]] || fail "Deploymentverzeichnis existiert nicht"

home_path="$(cd -- "$HOME" && pwd -P)"
REPOSITORY_PATH="$(cd -- "$raw_deploy_path" && pwd -P)"
case "$REPOSITORY_PATH" in
  "$home_path"/*) ;;
  *) fail "Deploymentverzeichnis liegt außerhalb des Benutzerverzeichnisses" ;;
esac

state_directory="$HOME/.local/state"
cache_directory="$HOME/.cache"
mkdir -p -- "$state_directory" "$cache_directory"
LOG_FILE="$state_directory/djkvfl-hetzner-deployments.log"
LOCK_PATH="$cache_directory/djkvfl-hetzner-deploy.lock"

mkdir -- "$LOCK_PATH" 2>/dev/null || fail "Ein Deployment läuft bereits oder die Deployment-Sperre ist noch gesetzt"

log() {
  printf '%s %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$1" | tee -a "$LOG_FILE"
}

log "Deploymentprüfung für Commit $EXPECTED_COMMIT gestartet"

git -C "$REPOSITORY_PATH" rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Deploymentpfad ist kein Git-Repository"
[[ "$(git -C "$REPOSITORY_PATH" symbolic-ref --short HEAD 2>/dev/null)" == "master" ]] || fail "Serverrepository befindet sich nicht auf master"
origin_url="$(git -C "$REPOSITORY_PATH" remote get-url origin 2>/dev/null)" || fail "Remote origin fehlt"
case "$origin_url" in
  *://*@*) fail "Remote origin darf keine eingebetteten Zugangsdaten enthalten" ;;
esac

tracked_status="$(git -C "$REPOSITORY_PATH" status --porcelain --untracked-files=no)"
[[ -z "$tracked_status" ]] || fail "Serverrepository enthält unerwartete Änderungen an versionierten Dateien"

[[ -f "$REPOSITORY_PATH/app.js" ]] || fail "Die serverseitige app.js fehlt"
if git -C "$REPOSITORY_PATH" ls-files --error-unmatch app.js >/dev/null 2>&1; then
  fail "app.js darf in dieser Deploymentphase nicht versioniert sein"
fi

previous_commit="$(git -C "$REPOSITORY_PATH" rev-parse HEAD)"

log "Remote-Stand wird ohne Working-Tree-Bereinigung aktualisiert"
git -C "$REPOSITORY_PATH" fetch --quiet --no-tags origin master

git -C "$REPOSITORY_PATH" cat-file -e "$EXPECTED_COMMIT^{commit}" 2>/dev/null || fail "Zielcommit ist auf dem Server nicht vorhanden"
[[ "$(git -C "$REPOSITORY_PATH" rev-parse origin/master)" == "$EXPECTED_COMMIT" ]] || fail "origin/master entspricht nicht dem erwarteten Push-Commit"

if git -C "$REPOSITORY_PATH" cat-file -e "$EXPECTED_COMMIT:app.js" 2>/dev/null; then
  fail "Zielcommit würde die serverseitige app.js übernehmen"
fi

git -C "$REPOSITORY_PATH" merge-base --is-ancestor "$previous_commit" "$EXPECTED_COMMIT" || fail "Zielcommit ist kein Fast-Forward des Serverstands"

node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
[[ "$node_major" == "24" ]] || fail "Auf dem Server ist nicht Node.js 24 aktiv"

STAGING_PATH="$(mktemp -d "$cache_directory/djkvfl-release.XXXXXX")"
git -C "$REPOSITORY_PATH" worktree add --detach "$STAGING_PATH" "$EXPECTED_COMMIT" >/dev/null

[[ "$(stat -c '%d' "$STAGING_PATH")" == "$(stat -c '%d' "$REPOSITORY_PATH")" ]] || fail "Build-Worktree und Repository müssen auf demselben Dateisystem liegen"

for environment_file in .env .env.local .env.production .env.production.local; do
  if [[ -f "$REPOSITORY_PATH/$environment_file" ]]; then
    ln -s -- "$REPOSITORY_PATH/$environment_file" "$STAGING_PATH/$environment_file"
  fi
done

log "Reproduzierbare Dependency-Installation wird im isolierten Buildverzeichnis ausgeführt"
(
  cd -- "$STAGING_PATH"
  npm ci --no-audit --no-fund --prefer-offline
)

log "Isolierter Next.js-Production-Build wird gestartet"
(
  cd -- "$STAGING_PATH"
  npm run build
)

[[ -d "$STAGING_PATH/.next" ]] || fail "Build war erfolgreich, aber .next fehlt"
[[ -d "$STAGING_PATH/node_modules" && ! -L "$STAGING_PATH/node_modules" ]] || fail "Isoliertes node_modules fehlt oder ist ein Symlink"

rm -rf -- "$REPOSITORY_PATH/node_modules.deploy-new" "$REPOSITORY_PATH/.next.deploy-new"
mv -- "$STAGING_PATH/node_modules" "$REPOSITORY_PATH/node_modules.deploy-new"
mv -- "$STAGING_PATH/.next" "$REPOSITORY_PATH/.next.deploy-new"

log "Build erfolgreich; Serverrepository wird per Fast-Forward auf den Zielcommit gesetzt"
git -C "$REPOSITORY_PATH" merge --ff-only "$EXPECTED_COMMIT"
[[ "$(git -C "$REPOSITORY_PATH" rev-parse HEAD)" == "$EXPECTED_COMMIT" ]] || fail "Serverrepository steht nicht auf dem Zielcommit"

rm -rf -- "$REPOSITORY_PATH/node_modules.deploy-previous" "$REPOSITORY_PATH/.next.deploy-previous"
if [[ -d "$REPOSITORY_PATH/node_modules" ]]; then
  mv -- "$REPOSITORY_PATH/node_modules" "$REPOSITORY_PATH/node_modules.deploy-previous"
fi
mv -- "$REPOSITORY_PATH/node_modules.deploy-new" "$REPOSITORY_PATH/node_modules"

if [[ -d "$REPOSITORY_PATH/.next" ]]; then
  mv -- "$REPOSITORY_PATH/.next" "$REPOSITORY_PATH/.next.deploy-previous"
fi
mv -- "$REPOSITORY_PATH/.next.deploy-new" "$REPOSITORY_PATH/.next"

tracked_status="$(git -C "$REPOSITORY_PATH" status --porcelain --untracked-files=no)"
[[ -z "$tracked_status" ]] || fail "Versionierter Serverstand ist nach dem Build nicht sauber"
[[ -f "$REPOSITORY_PATH/app.js" ]] || fail "Die serverseitige app.js wurde unerwartet entfernt"

log "BUILD ERFOLGREICH für Commit $EXPECTED_COMMIT"
log "MANUELLER NODE.JS-NEUSTART IN KONSOLEH ERFORDERLICH"
