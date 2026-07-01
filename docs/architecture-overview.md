# Architektur Übersicht

Diese Datei bündelt die technische Zielarchitektur der Vereinsplattform.

## Hauptbereiche

- Öffentliche Website
- Admin-CMS
- Supabase Datenbank
- Supabase Storage
- Wiederverwendbare UI-Komponenten
- Service-Schicht
- Migration zur späteren Live-Datenbank

## Grundprinzip

Jedes Modul besteht aus:

1. Datenbankstruktur
2. Service-Logik
3. UI-Komponenten
4. Dokumentation

## Aktueller Architekturstand

- Next.js App Router
- Supabase als Entwicklungsdatenbank
- Modulare Admin-Komponenten
- Saisonfähiges Mannschaftssystem
- Zentrales Löschmodul über `remove_entity()`
- fussball.de Widgets technisch vorbereitet

## Ziel

Die spätere Live-Datenbank soll sauber und ohne Altlasten aufgebaut werden. Die aktuelle Supabase-Instanz bleibt Entwicklungsdatenbank.
