# B15.21C1 – Zuständigkeit und internes Routing

## Sicherheitsmodell

Membership-Zugriff besteht aus zwei serverseitigen Ebenen: Eine der bestehenden Permissions `membership_requests.view`, `.edit` oder `.forward` erlaubt die jeweilige Operation grundsätzlich. Der zentrale Zuständigkeitsresolver begrenzt sie zusätzlich anhand des gespeicherten `request_type` und der aktiven Benutzerrollen. Erst danach wird der privilegierte Datenzugriff beziehungsweise die Mutation ausgeführt. Clientfilter sind keine Sicherheitsgrenze.

## Matrix

| Anfrageart | Zuständige technische Rollen |
| --- | --- |
| Aktives Mitglied Fußball | `jugendleiter` (Kompatibilitätsalias `jugendkoordinator`), `fussball-vorstand` |
| Aktives Mitglied Tischtennis | `tischtennis-vorstand` |
| Damen-Gymnastik | `damen-gymnastik-vorstand` |
| Behindertensport | `behindertensport-vorstand` |
| Trainer werden | `vorstand` |
| Passives Mitglied | `vorstand` |
| Legacy `sonstiges` | `vorstand` |

`superadmin` besitzt immer Lese-, Bearbeitungs- und Weiterleitungszugriff. Der bestehende Gesamtvorstand behält seine übergeordnete Sicht auf alle Anfragearten. Eine Permission allein, etwa bei `kassierer`, begründet keine fachliche Zuständigkeit.

## Notifications

`membership_created` und spätere Membership-Policy-Notifications verwenden denselben Zuständigkeitsresolver. Alle aktiven Profile mit einer passenden aktiven Rolle und der View-Permission werden berücksichtigt; Empfänger werden per User-ID dedupliziert. Das bisherige globale Verhalten bleibt für Superadmins erhalten. Trainer, Betreuer und Mannschaftsverantwortliche werden nicht aus `desired_team_id` oder `desired_team_season_id` abgeleitet.

## Weiterleitung

Die ursprüngliche Anfrageart und damit die initiale Zuständigkeit bleiben unverändert. Eine berechtigte Person kann weiterhin an einen aktiven Coach oder ein aktives Vorstandsmitglied weiterleiten. Typ, ID, Name und E-Mail des Ziels werden serverseitig aus dem gespeicherten Zielobjekt abgeleitet. Persönlich zugewiesene Coaches behalten ausschließlich ihren record-bound Zugriff.

## SQL-Rollout

Die C1-SQL-Familie ergänzt drei Abteilungsvorstandsrollen und ordnet die bestehenden Membership-Permissions zu. Sie verändert keine Membership-Daten, Grants oder RLS-Policies. Reihenfolge: Preflight, Proposal, Postcheck. Rollback nur nach Prüfung, dass keine neue Rolle einem Benutzer zugeordnet ist.
