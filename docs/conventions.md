# Konventionen

## Dateien

- Komponenten: PascalCase, zum Beispiel `NewsCard.js`
- Services: Modulname plus `.service.js`
- Helper: beschreibender Name plus `.helpers.js`
- Index-Dateien nur für Exporte nutzen

## Datenbank

- Tabellen in snake_case
- Fremdschlüssel mit `_id`
- Relationstabellen mit beiden Entitäten im Namen
- Saisonabhängige Daten nicht im Stammdatensatz speichern

## Module

Jedes Modul enthält idealerweise:

- Übersicht
- Formular
- Komponenten
- Services
- Utils oder Helper
- Dokumentation

## Commits

Commit-Nachrichten sollen kurz beschreiben, was geändert wurde.
