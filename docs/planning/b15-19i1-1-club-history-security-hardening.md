# B15.19I1.1 – Chronik RLS-/Grant-Härtung

## Bestätigter Live-Ausgangszustand

Auf `club_history_pages`, `club_history_images` und `club_history_milestones` ist RLS aktiv, aber nicht erzwungen. Je Tabelle erlaubt eine `*_dev_write`-Policy `ALL` mit `USING(true)` und `WITH CHECK(true)` für `anon` und `authenticated`. Beide Browserrollen besitzen außerdem effektiv SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES und TRIGGER. Die fachlichen `*_public_read`-Policies filtern öffentliche Reads korrekt und bleiben unverändert.

## Schreibpfadmatrix

| Operation | Vor I1.1 | Client | Autorisierung vorher | Ziel nach I1.1 |
| --- | --- | --- | --- | --- |
| Chronikseite Insert/Update, Publish, Aktivstatus | `upsertClubHistoryPage` | Browser-Supabase aus `ClubHistoryEditorForm` | nur UI-Sichtbarkeit | `saveClubHistoryPageAction`, `club_history.edit`, server-only Admin-Client |
| Meilenstein Insert | `createClubHistoryMilestone` | Browser-Supabase aus `ClubHistoryMilestonesManager` | nur UI-Sichtbarkeit | `createClubHistoryMilestoneAction`, `club_history.edit`, server-only Admin-Client |
| Meilenstein Update | `updateClubHistoryMilestone` | Browser-Supabase | nur UI-Sichtbarkeit | `updateClubHistoryMilestoneAction`, `club_history.edit`, server-only Admin-Client |
| Meilenstein Delete | `deleteClubHistoryMilestone` | Browser-Supabase | nur UI-Sichtbarkeit | `deleteClubHistoryMilestoneAction`, `club_history.edit`, server-only Admin-Client |
| Bild Insert/Update/Delete | I1 Server-Actions | server-only Admin-Client | `club_history.edit` | unverändert serverseitig |
| Zentraler Bild-Upload | I1 `uploadClubHistoryMediaAction` | server-only Media-Service | `club_history.edit` | unverändert serverseitig |
| Öffentliche Reads | öffentliche Server Page über Anon-Client/RLS | Server Component | Public-Read-Policies | unverändert |

Der Admin-Loader und die serverseitige Seiten-Existenzprüfung verwenden nach erfolgreicher `club_history.view`- beziehungsweise `club_history.edit`-Prüfung ebenfalls den server-only Admin-Client. Dadurch bleiben unveröffentlichte oder inaktive Entwürfe nach Entfernung der offenen Policy im Editor sichtbar.

Es wurden keine Chronik-RPCs oder weiteren Storage-Delete-/Upload-Pfade gefunden. Der zentrale Assignment-RPC ist nur für `service_role` ausführbar.

## Zielzustand

- `anon` und `authenticated`: ausschließlich SELECT auf allen drei Tabellen.
- Keine Browser-Policy mit ALL, INSERT, UPDATE oder DELETE.
- TRUNCATE, REFERENCES und TRIGGER sind für Browserrollen entzogen.
- `service_role` und `postgres` werden vom Proposal nicht verändert.
- RLS bleibt aktiv, FORCE RLS bleibt unverändert false.
- Keine Daten-, Schema- oder Medienmigration in I1.1.
