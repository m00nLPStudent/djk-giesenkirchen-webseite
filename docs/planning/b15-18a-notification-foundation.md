# B15.18A – Zentrale Benachrichtigungsinfrastruktur

## Ergebnis

Die Implementierung stellt eine generische Notification-Domäne, ein persönliches Notification Center unter `/admin/notifications` und ein funktionales Glocken-Dropdown bereit. Noch kein Fachmodul erzeugt Benachrichtigungen. Solange der SQL-Vorschlag nicht manuell eingespielt wurde, bleiben Übersicht und Glocke bewusst leer und das übrige Adminsystem funktionsfähig.

## Architektur

- `notification.dto.js`: einziges UI-DTO und defensives Mapping.
- `notifications.repository.js`: alle Datenzugriffe, ausnahmslos mit `recipient_user_id`-Filter.
- `notifications.service.js`: zentrale API für einzelne/batchweise Erzeugung, Laden, Zählen, Lesen und Löschen.
- Server Actions authentifizieren den aktuellen Admin und übergeben ausschließlich dessen Auth-User-ID.
- Notification-Typen sind freie, normalisierte Schlüssel. Es gibt keine fachmodulspezifische Check-Constraint oder zentrale Hardcode-Liste.
- `target_url` wird auf interne Adminpfade begrenzt; ungültige Ziele fallen auf `/admin/notifications` zurück.

## Sicherheitsmodell

RLS erlaubt authentifizierten Benutzern SELECT, UPDATE und DELETE ausschließlich für eigene Datensätze. UPDATE-Rechte sind zusätzlich auf `is_read` und `read_at` begrenzt. Es existiert keine Client-INSERT-Policy; Erzeugung erfolgt über vertrauenswürdige serverseitige Dienste mit der bereits vorhandenen Service-Infrastruktur. Superadmins erhalten keine Sonderleserechte auf fremde Benachrichtigungen.

## Aktualisierung

Es gibt kein dauerhaftes Polling. Glockeninstanzen teilen sich eine laufende Ladeanfrage und aktualisieren beim Mounten, beim Öffnen sowie nach erneutem Fokus des Browserfensters. Mutationen aktualisieren die Ansicht unmittelbar.

## SQL-Reihenfolge

1. `b15-18a-notifications-schema-proposal.sql`
2. `b15-18a-notifications-rls-proposal.sql`
3. `b15-18a-notifications-postcheck-readonly.sql`
4. Browser-/RLS-Test mit zwei unterschiedlichen Benutzern

Rollback: `b15-18a-notifications-rollback.sql`. Keine dieser Dateien wurde automatisch ausgeführt.

## Noch bewusst offen

- Fachmodule werden erst in Folgeaufgaben an `createNotification`/`createNotifications` angebunden.
- Ein produktiver Realtime-Kanal ist nicht aktiviert; die lastarme Fokus-/Öffnungsaktualisierung ist die initiale Strategie.
