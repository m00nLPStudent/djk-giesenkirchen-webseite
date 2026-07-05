# Architecture Overview

## Zielbild

Das Projekt besteht aus:

- einer abgeschlossenen öffentlichen Vereinswebsite (mobile-first responsive)
- einem modularisierten Admin-CMS
- einem gemeinsamen Daten- und Helper-Layer auf Supabase-Basis

## Systemaufbau

- App Router mit Segmenten
  - öffentliche Website: `src/app/(website)`
  - Admin: `src/app/admin`
- Komponentenstruktur
  - Website: `src/components/website`
  - Admin: `src/components/admin`
  - Shared: `src/components/common`
- Infrastruktur und Services
  - `src/lib/*` für wiederverwendbare Helper/Service-Funktionen
  - Supabase als Daten- und Storage-Backend

## Public-Website Architektur

- Layout über `src/app/(website)/layout.js` mit globalem Header/Footer
- Header mit Desktop-Navigation und mobilem Burger-Menü
- Seitenmodule für:
  - Verein
  - Fußball
  - News
  - Termine
  - Mitglied werden
  - Kontakt
  - Rechtstexte

## Admin-Architektur

- Modulorientierte Admin-Bereiche für Inhalte und Stammdaten
- zentrale Settings-Verwaltung für `club_settings`, `club_contacts`, `pages`, Mitgliedsanfragen
- geteilte Admin-Komponenten und Helper statt monolithischer Einzelimplementierungen

## Grundprinzipien

- Keine Feature-Entwicklung ohne konsistente Modell-/Service-/UI-Kette
- Modullogik kapseln, Shared-Code zentralisieren
- Dokumentation ist Teil des Produktstands und wird synchron gepflegt
