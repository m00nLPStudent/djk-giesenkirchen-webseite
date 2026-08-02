# B15.16G1 – RLS-Schreibzugriff für Mannschaftsvorlagen

## 1. Status

**DURCH B15.16G3 ABGELÖST.** Der JWT-Ansatz aus G2 wurde verworfen, weil `app_metadata.role` nicht existiert. Maßgeblich sind ausschließlich die drei `b15-16g3-*`-Dateien mit direkter Anbindung an die vorhandenen Admin-Profil-, Rollen- und Permissiontabellen. Es wurde kein SQL automatisch ausgeführt.

## 2. Fehlerbild

Der Browserzugriff auf `team_templates` verwendet den normalen Supabase-Client. Beim Anlegen wird eine RLS-Verletzung gemeldet; die Oberfläche zeigt nun nur noch eine sichere, verständliche Fehlermeldung.

## 3. Statische Bestandsaufnahme

Im Repository existiert keine Policy-Definition für `team_templates`. Das beweist nicht den Live-Zustand. Der vorhandene Helper `is_superadmin_actor()` bildet nur Superadmin ab und ist kein allgemeiner Permission-Resolver.

## 4. Authentifizierungsmodell

Die Anwendung löst das Admin-Profil primär über `admin_profiles.id = auth.uid()` und ersatzweise über normalisierte E-Mail auf. Rollen und Permissions werden über `admin_user_roles`, `admin_roles`, `admin_role_permissions` und `admin_permissions` geladen.

## 5. Berechtigungsmodell

Die UI schützt die Verwaltungsrouten mit `settings.edit`; Superadmin besitzt im Permission-Engine zusätzlich einen Bypass.

## 6. Festgestellter Konflikt

Der Repository-Seed weist `settings.edit` Superadmin, Webmaster **und Kassierer** zu. G1 verlangt dagegen, Kassierer auszuschließen. Ohne Änderung der Permission-Zuordnung kann eine reine `settings.edit`-Policy beide Vorgaben nicht gleichzeitig erfüllen.

## 7. Preflight

`b15-16g1-team-templates-rls-preflight-readonly.sql` inventarisiert RLS, Policies, Grants, Schema, Trigger, Helper, Permission-Zuordnungen und die ID-/E-Mail-Zuordnung. Es enthält nur lesende Abfragen.

## 8. Helper-Proposal

Da kein allgemeiner Helper vorhanden ist, liegt `b15-16g1-current-admin-permission-helper-proposal.sql` separat vor. Es spiegelt direkte ID- und E-Mail-Zuordnung, aktive Profile/Rollen, Superadmin-Bypass und Permission-Key-Prüfung. Ausführung erst nach fachlicher und sicherheitstechnischer Prüfung.

## 9. Policy-Proposal

Das additive Proposal definiert ausschließlich drei Policies für `INSERT`, `UPDATE` und `DELETE` auf `team_templates`. Jede Policy verlangt `current_admin_has_permission('settings.edit')`.

## 10. Fail-closed-Vorbedingungen

Das Proposal bricht ab, wenn der Helper fehlt oder `settings.edit` einer laut G1 ausgeschlossenen Rolle zugeordnet ist. Es erweitert keine SELECT-Policy und verwendet weder `USING (true)` noch `WITH CHECK (true)`.

## 11. SELECT-Verhalten

Bestehende SELECT-Policies werden weder ersetzt noch entfernt. Ihr Live-Zustand muss durch Preflight und Postcheck verglichen werden.

## 12. Rollback

Der Rollback entfernt ausschließlich die drei neuen Write-Policies. RLS, SELECT-Zugriff, Tabellen und der separat verwaltete Helper bleiben unberührt.

## 13. Sichere Ausführungsreihenfolge

1. Preflight im Supabase SQL Editor ausführen und Ergebnis sichern.
2. RLS, vorhandene Policies, Grants, Profilzuordnung und tatsächliche `settings.edit`-Rollen prüfen.
3. Bei einer ausgeschlossenen Rolle sofort stoppen; Permission-Zuordnung nur in einem separat autorisierten Auftrag klären.
4. Falls kein passender Helper existiert, das Helper-Proposal prüfen und erst nach Freigabe ausführen.
5. Policy-Proposal prüfen und ausführen.
6. Postcheck ausführen und mit dem Preflight vergleichen.
7. Browserprüfungen mit Superadmin, Webmaster und mindestens einer ausgeschlossenen Rolle durchführen.

## 14. Erwartete Positivtests

Superadmin und Webmaster können – sofern ihre Live-Profile aktiv und korrekt zugeordnet sind – Vorlagen anlegen, bearbeiten, aktivieren/deaktivieren und unbenutzte Vorlagen löschen.

## 15. Erwartete Negativtests

Vorstand, Jugendleitung/-koordination, Kassierer, Trainer, Betreuer, Gast, anonyme und inaktive Konten dürfen nicht schreiben. Der Browser darf keine rohe RLS-Meldung anzeigen.

## 16. Unveränderte Bereiche

Keine Tabellen-, Spalten-, Routing-, Scope-, Upload-, Team-, Saison-, Spieler-, Trainer- oder Public-Page-Änderung. Keine Service-Role-Verwendung. Keine bestehenden Daten werden verändert.

## 17. Offene Risiken

Der Live-Policy-Stand ist unbekannt. Der E-Mail-Fallback muss gegen die Live-Daten geprüft werden. Unterschiedliche oder doppelte E-Mail-Zuordnungen sowie die widersprüchliche Kassierer-Permission können eine Freigabe verhindern.

## 18. Freigabekriterium

Freigabe erst, wenn der Preflight bestätigt, dass ausschließlich die fachlich erlaubten Rollen `settings.edit` besitzen, die Profilzuordnung eindeutig ist und keine kollidierenden Write-Policies existieren.
