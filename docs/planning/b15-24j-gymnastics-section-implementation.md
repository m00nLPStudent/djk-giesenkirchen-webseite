# B15.24J – Gymnastikdamen: Section-Implementierung

Status: **COMPLETE – DASHBOARD, PUBLIC WEBSITE, HOMEPAGE TRAINING, ROLES AND RESPONSIVE REVIEW VERIFIED**

## As-built-Vertrag

B15.24J verwendet die in B15.24I eingeführte neutrale Department-Section-Architektur ohne Datenbankmigration. Das bestehende aktive Department wird ausschließlich serverseitig über den festen Slug `damen-gymnastik` aufgelöst. Es wurden keine Tabelle, Spalte, Permission, Policy, Media-Usage oder Contact-RPC ergänzt.

Der Dashboardbereich liegt unter `/admin/gymnastikdamen`. Navigation und Route verlangen `department_sections.view`; alle Mutationen verlangen serverseitig `department_sections.edit`. Diese Permissions sind im bestehenden Livevertrag ausschließlich Superadmin und Gesamtvereinsvorstand zugeordnet. Clientseitige Department-IDs werden nicht akzeptiert. Update und Delete einer Trainingszeit prüfen vor der Mutation, dass der Datensatz zum serverseitig aufgelösten Department gehört.

Der gemeinsame `DepartmentSectionEditor` und die gemeinsame server-only Operationsschicht verwalten Titel, Aktiv-/Publishstatus, deutschen Beschreibungstext, expliziten Section-Kontakt samt Public-Toggle, zentrales Public-Gruppenbild und beliebig viele teamunabhängige Trainingszeiten. Fehlt die eindeutige Section, zeigt das Dashboard den leeren Erstzustand; erst das Speichern legt sie kontrolliert an.

Die öffentliche Route `/damen-gymnastik` verwendet denselben fail-closed Public-Repository-/DTO-/Layout-Vertrag wie `/behindertensport`. Fehlendes oder inaktives Department sowie fehlende, inaktive oder unveröffentlichte Section führen zu 404. Kontaktwerte werden nur bei expliziter Freigabe ausgegeben. Ein fehlendes, privates oder archiviertes Public-Medium beeinflusst die Section-Sichtbarkeit nicht; stattdessen erscheint das vorhandene Gymnastik-Sporticon als Placeholder. Kontaktdaten gelangen nicht in die Metadata.

Der bereits neutrale Homepage-Department-Loader lädt alle qualifizierten veröffentlichten Department-Sections. Gymnastikzeiten werden daher ohne Sonderloader als `department_training`-Occurrences erzeugt, gemeinsam mit Team- und anderen Department-Terminen chronologisch sortiert, durch globale Vereinsschließzeiten gefiltert und erst danach auf die Homepage-Grenze reduziert. Titel ist der veröffentlichte Section-Titel mit Department-Anzeigename als Fallback; Linkziel ist `/damen-gymnastik`, das vorhandene Gymnastikicon wird über den zentralen Resolver gewählt.

## Manuelle Abnahme

Der vollständige Betreiberreview ist bestanden. Im Dashboard wurden Create, Update, Persistenz, Titel, Beschreibung, Aktiv-/Publishstatus, Gruppenbild, expliziter Kontakt samt Public-Toggle sowie Trainingszeiten und Trainingsort bestätigt. Die öffentliche Seite übernimmt Änderungen korrekt; inaktive oder unveröffentlichte Sections liefern 404 und werden nach erneuter Aktivierung beziehungsweise Veröffentlichung wieder sichtbar.

Die Homepage zeigt Gymnastikdamen-Training mit korrektem Titel, Icon, Uhrzeit, Ort und chronologischer Position. Deaktivierte Trainingszeiten und unveröffentlichte Sections werden unterdrückt und nach Reaktivierung wieder berücksichtigt. Superadmin und Gesamtvereinsvorstand können den Bereich bearbeiten; Tischtennis-Vorstand und andere Fachbereichsrollen bleiben ausgeschlossen. Der Responsive Review ist ohne relevante Auffälligkeit bestanden.

B15.24J erforderte keine DB-Migration, kein SQL, keine neue Permission und keine neue Rolle. Die neutrale B15.24I-Architektur wurde erfolgreich wiederverwendet.
