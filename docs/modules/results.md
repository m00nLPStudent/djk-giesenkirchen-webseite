# Ergebnismodul

Stand: 27. September 2026 · Version 1.0.9

## Daten- und Sicherheitsvertrag

`public.club_results` speichert manuell gepflegte Fußball- und Tischtennisergebnisse über eine Referenz auf `team_seasons`. Administrative Browserclients besitzen keinen direkten Schreibpfad. Server Actions prüfen Session, die jeweils konkrete Permission und den Department-Scope, bevor das serverseitige Repository mit Service Role arbeitet.

Die Permissions sind `results.view`, `results.create`, `results.edit`, `results.delete` und `results.publish`. Superadmin und die technische Adminrolle `webmaster` verwalten Fußball und Tischtennis. `fussball-vorstand` und `tischtennis-vorstand` bleiben auf ihr verwaltetes Department begrenzt. Die gleichnamige Board-Funktion Webmaster ist keine technische Rolle und gewährt keinen Zugriff.

Beim Bearbeiten werden sowohl die bestehende Zuordnung als auch eine gegebenenfalls neu gewählte Mannschaftssaison geprüft. Angeboten werden ausschließlich aktive Mannschaftssaisons der aktiven Departments `fussball` und `tischtennis`; Gymnastikdamen und Behindertensport gehören nicht zum Modul.

## Dashboard

Die zentrale Route `/admin/results` bietet Liste, Suche und Filter nach Sportart, Mannschaft und Veröffentlichungsstatus. Berechtigte Benutzer können Ergebnisse anlegen, bearbeiten, löschen sowie veröffentlichen oder zurückziehen. Das Formular verwaltet Mannschaftssaison, Wettbewerb, Spielzeitpunkt, Heim-/Auswärtsstatus, Gegnername, beide Ergebnisstände, Veröffentlichungsstatus und einen optionalen individuellen Anzeigezeitraum.

Ohne Override ist das Ergebnis ab `played_at` sieben Tage sichtbar. Ein Override verlangt immer `visible_from` und `visible_until`, wobei das Ende nach dem Beginn liegen muss.

## Medien

Ein Gegnerlogo ist optional und wird über die zentrale Medienbibliothek verwaltet. Zulässig sind aktive öffentliche Bilder mit `purpose = result`. Die Zuordnung wird über `entity_type = result` und `field_name = opponent_logo` synchronisiert. Das Asset selbst wird beim Entfernen der Zuordnung oder Löschen eines Ergebnisses nicht blind gelöscht.

## Öffentlicher Ergebnisticker

Das server-only Public Repository lädt ausschließlich veröffentlichte Ergebnisse im effektiven Sichtbarkeitsfenster und prüft zusätzlich aktive Mannschaftssaison, Mannschaft, Saison und Abteilung. Ohne Override gilt `played_at <= now < played_at + 7 Tage`; mit Override gilt `visible_from <= now < visible_until`. Der Client erhält nur das kompakte Public DTO, keine Audit-, Permission- oder privaten Mediendaten.

Die zentrale Route-Context-Logik unterscheidet `mixed`, `football`, `table-tennis` und `hidden`: Allgemeine Vereinsseiten zeigen Fußball und Tischtennis gemeinsam, die beiden Sportbereiche ausschließlich ihr Department, Gymnastikdamen und Behindertensport keinen Ticker. Heim-/Auswärtsnamen, Scores und Logos werden im Core aus `club_is_home` abgeleitet. Das Vereinslogo nutzt `PUBLIC_SITE_LOGO_URL`; Gegnerlogos werden über den zentralen Public-Media-Resolver geladen, fehlende Logos erhalten einen neutralen Platzhalter.

Der Ticker sitzt im gemeinsamen öffentlichen Header zwischen Servicebereich und Hauptnavigation. Ab einem Ergebnis läuft die aus zwei geometrisch identischen Tracks bestehende Darstellung permanent mit `45s linear`; `translate3d()` und ein gezieltes `will-change: transform` halten die Bewegung compositor-freundlich. Die sichtbare Reihenfolge bleibt Sportart-Icon, Mannschaft, Heimlogo, Ergebnis und Auswärtslogo. Auf Desktop ist der Ticker kompakt rechts ausgerichtet, auf Tablet und Mobile responsiv in voller verfügbarer Breite.

Eine statische CSS-Maske blendet den Inhalt links und rechts weich ein beziehungsweise aus. Hover und Fokus pausieren die Animation. Bei `prefers-reduced-motion: reduce` entfällt die automatische Bewegung und die Maske; die Ergebnisliste bleibt horizontal vollständig erreichbar. Die zweite Trackkopie ist für Assistenztechnik verborgen, während der sichtbare Eintrag Mannschaft, Heim- und Auswärtsverein sowie Endstand über seinen Accessible Name vollständig beschreibt. Leere oder ausgeblendete Kontexte reservieren keine zusätzliche Headerhöhe.

Erfolgreiche Create-, Edit-, Delete-, Publish- und Unpublish-Aktionen revalidieren den öffentlichen Website-Layoutvertrag, sodass der server-only geladene Ticker aktualisiert wird.
