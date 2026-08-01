# B12 Abschlussstand

Status: abgeschlossen (Planung und fachliche Absicherung).

## Erledigt

- [x] Rollen- und Scope-Modell fuer Superadmin, Vorstand, Fussballvorstand, Jugendkoordinator, Trainer und weitere Rollen dokumentiert.
- [x] Team-, Trainer- und Spieler-Scopes serverseitig konsolidiert.
- [x] Own-Board-Card-Prinzip auf admin_profile_id-Basis dokumentiert und abgesichert.
- [x] SQL-Proposals in docs/sql mit Status-Kopf versehen (implemented, superseded, optional, still required).
- [x] Team-Create bleibt fuer Jugendkoordinator an teams.create gebunden.

## SQL-Proposal-Status

| Proposal                                                                                                                           | Status         | Bemerkung                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| b12-profile-links-proposal.sql (Datei: bereits-umgesetzt-b12-profile-links-proposal.sql)                                           | IMPLEMENTED    | Bereits produktiv ueber admin_profile_id-Links genutzt. Nicht erneut ausfuehren.                 |
| b12-team-scopes-proposal.sql (Datei: aktuell-nicht-erforderlich–b12-team-scopes-proposal.sql)                                      | SUPERSEDED     | Aktuell nicht erforderlich, da Scope-Ableitung ueber Rollen plus Team-Season-Relationen erfolgt. |
| b12-membership-contributions-proposal.sql (Datei: noch-nicht-ausfuehren-b12-membership-contributions-proposal.sql)                 | OPTIONAL       | Modul nicht produktiv ausgerollt. Fuer spaetere Phase offen.                                     |
| b12-membership-contribution-payments-proposal.sql (Datei: noch-nicht-ausfuehren-b12-membership-contribution-payments-proposal.sql) | OPTIONAL       | Abhaengig von optionalem Contributions-Rollout.                                                  |
| b12-content-workflow-proposal.sql (Datei: noch-nicht-ausfuehren-b12-content-workflow-proposal.sql)                                 | SUPERSEDED     | Derzeitiges Publikationsmodell bleibt bestehen.                                                  |
| b12-role-permission-adjustment-proposal.sql (Datei: nach-Pruefung-ausfuehrbar-b12-role-permission-adjustment-proposal.sql)         | STILL REQUIRED | Enthaltene Rollen-Permission-Links sind fuer finalen Zielstand manuell nach Review ausfuehrbar.  |

## Nach B13 verschoben

- [ ] Membership
- [ ] Payments
- [ ] Workflow
- [ ] Datenbankkonsolidierung

Diese Punkte werden in der B13-Roadmap weitergefuehrt.
