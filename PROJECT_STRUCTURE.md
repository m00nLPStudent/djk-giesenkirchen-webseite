# DJK/VfL Giesenkirchen Vereins-CMS

## Projektziel

Entwicklung eines modernen Vereinsverwaltungssystems für die DJK/VfL Giesenkirchen 05/09 e.V.

Das System soll langfristig alle Bereiche des Vereins digital verwalten können.

---

# Technologien

- Next.js
- React
- Supabase
- TailwindCSS
- Lucide Icons

---

# Projektstruktur

src/

app/
│
├── (website)/
│ ├── layout.js
│ ├── page.js
│ ├── news/
│ ├── fussball/
│ ├── tischtennis/
│ ├── damengymnastik/
│ └── ...
│
└── admin/
├── layout.js
├── page.js
├── news/
├── teams/
├── coaches/
├── players/
├── media/
├── events/
├── tournaments/
├── settings/
└── users/

---

# Komponentenstruktur

src/components/admin/

dashboard/
news/
teams/
coaches/
players/
media/
events/
tournaments/
settings/
users/
layout/
shared/
ui/

---

# Aufbau jedes Moduls

Jedes Modul besitzt zukünftig möglichst den gleichen Aufbau.

Beispiel:

news/

components/
forms/
tables/
cards/
dialogs/
hooks/
services/
utils/
constants/
index.js

---

# Regeln

## Komponenten

Eine Komponente hat nur eine Aufgabe.

Keine Komponenten mit mehr als ca. 300 Zeilen.

Lieber mehrere kleine Komponenten.

---

## Datenbank

Alle Daten laufen über Supabase.

Keine direkten SQL-Abfragen im Frontend.

Alle Datenbankzugriffe werden später in Services ausgelagert.

---

## Design

Farben

Primär:
Rot (#C4001A)

Sekundär:
Schwarz
Dunkelgrau
Weiß

Alle Adminseiten besitzen:

- Sidebar
- Topbar
- Titel
- Untertitel

---

# Dashboard

Dashboard besteht aus einzelnen Komponenten:

DashboardWelcome

DashboardStats

DashboardLatestNews

DashboardPlannedNews

DashboardQuickActions

DashboardSystemStatus

DashboardToday

DashboardWeather

DashboardBirthdays

DashboardTasks

---

# News

News besteht aus:

Liste

Bearbeiten

Erstellen

Kategorien

Entwürfe

Veröffentlichungen

---

# Mannschaften

Mannschaften besitzen:

Allgemeine Daten

Trainer

Spieler

Trainingszeiten

Kontakt

Bilder

Social Media

Downloads

---

# Trainer

Trainer besitzen:

Profilbild

Name

Funktion

Lizenz

Telefon

WhatsApp

E-Mail

Social Media

Mannschaften

---

# Spieler

Spieler besitzen:

Profilbild

Vorname

Nachname

Rückennummer

Position

Geburtsjahr

Größe

Nationalität

Lieblingsfuß

Mannschaften

---

# Medien

Medien besitzen:

Bilder

Videos

Dokumente

Downloads

Galerien

---

# Termine

Training

Spiele

Turniere

Vereinsveranstaltungen

---

# Benutzer

Benutzerrollen

Superadmin

Administrator

Redakteur

Trainer

Betreuer

Vorstand

---

# Langfristige Ziele

- Mehrsprachigkeit
- Rollenverwaltung
- Push-Nachrichten
- Mitgliederverwaltung
- Sponsorenverwaltung
- Vereinsshop
- Newsletter
- Kalender
- Spielberichte
- Statistiken
- Mobile Optimierung
- PWA
- App-Anbindung

---

# Entwicklungsregel

Neue Funktionen werden ausschließlich als eigenes Modul entwickelt.

Vorhandene Module werden erweitert.

Die Architektur wird nicht mehr grundlegend verändert.

# Spielbetrieb

Das Vereins-CMS soll den kompletten offiziellen Spielbetrieb automatisch darstellen.

## Mannschaftsseiten

Jede Mannschaft besitzt zusätzlich:

- Aktuelle Tabelle
- Letztes Spiel
- Nächste drei Spiele
- Saisonstatistik
- Wettbewerb
- Spielplan
- Heim-/Auswärtsspiele
- News der Mannschaft
- Bildergalerie
- Turniere

---

## Startseite

Die Vereinswebseite zeigt automatisch:

- Spiele heute
- Spiele morgen
- Spiele am Wochenende
- Letzte Ergebnisse
- Kommende Heimspiele
- Kommende Auswärtsspiele

---

## Dashboard

Das Dashboard zeigt zukünftig:

- Heutige Trainings
- Heutige Spiele
- Spiele morgen
- Turniere am Wochenende
- Offene Spielberichte
- Neue Ergebnisse
- Geburtstage
- Wetter
- Neue Medien
- Vereinsinformationen

---

## Datenquellen

Das System soll möglichst viele Daten automatisch beziehen.

Geplante Datenquellen:

- fussball.de
- DFBnet (soweit technisch möglich)
- Vereinsinterne Datenbank
- Supabase
- Wetterdienst
- Google Maps
- Social Media

Manuelle Eingaben sollen möglichst vermieden werden.

Das CMS soll offizielle Spielbetriebsdaten automatisch synchronisieren.

---

## Spielbetrieb-Modul

Eigenes Modul:

admin/
└── matches/

Dieses Modul verwaltet:

- Spielpläne
- Tabellen
- Ergebnisse
- Wettbewerbe
- Ligen
- Gegner
- Spielorte
- Schiedsrichter (optional)
- Spielberichte
- Liveticker (optional)

---

## Langfristiges Ziel

Die Vereinswebseite soll weitgehend selbstständig aktuell bleiben.

Neue Ergebnisse, Tabellen und Spielpläne werden automatisch übernommen und auf allen Seiten dargestellt.

Der Administrator ergänzt nur vereinseigene Inhalte wie News, Fotos oder Spielberichte.
