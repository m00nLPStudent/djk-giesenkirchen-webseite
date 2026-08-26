# Abgeschlossene größere Entwicklungsblöcke

## B15.18 – Notifications und Reminder

Umgesetzt sind persönliche Notifications, Notification Center und Glocke, Preferences, fachliche Assignment-/Membership-/Contribution-/Editorial-/Training-Notifications, persistentes Audit, Monitoring, Idempotenz, zentraler Notification-Service, kontrollierter serverseitiger Audit-Append sowie die technische Contribution-Reminder-Dispatcher-/Cron-Vorbereitung. Die operative Cron-Aktivierung bleibt bewusst unter Go-live in der [aktuellen Roadmap](current-roadmap.md).

## B15.19 – Zentrale Medienbibliothek

Umgesetzt sind Media Assets und Usages, Purpose- und Visibility-Modell, serverseitige Upload-/MIME-/Signaturvalidierung, Media Picker, Cross-Purpose-Auswahl, Archivschutz, sichere Assignment-RPCs sowie Public-/Admin-Resolver.

Integriert sind Spieler, Trainer, Vorstand, Vereinskontakte, Mannschaften, Mannschaftssaisons und -kontakte, News-Titelbilder/-Dokumente/-Inline-Medien, Event-Titelbilder/-Dokumente, Sponsorlogos und Vereinschronikbilder.

Security- und Rollenabschlüsse:

- B15.19H: Sponsorintegration, RLS-/Grant-Härtung und `remove_entity`-RPC-Härtung.
- B15.19I: Vereinschronik, zentrale Bilder, Usage-/Archivschutz und SELECT-only-Browserrollen.
- B15.19J/J1: Rollen-/Permission-Audit und `settings.edit` für Board-Mutationen.
- B15.19J2: getrennte Publish-Permissions für News, Events und Chronik.
- B15.19J2.1: Event-Mutationsclient und semantische `datetime-local`-Behandlung.
- B15.19J2.2: Event-Entwürfe bleiben im autorisierten Admin-Read sichtbar; Public Reads bleiben published-only.

Detailentscheidungen und Rolloutnachweise verbleiben in den jeweiligen `docs/planning/b15-18*`-, `docs/planning/b15-19*`- und `docs/sql/b15-18*`-/`b15-19*`-Dateien.
