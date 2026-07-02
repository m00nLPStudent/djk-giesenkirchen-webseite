# Backend Architektur

## Ziel

Die Backend-Schicht verbindet Adminbereich, Website und Datenbank über klare Services.

## Aktueller Stand

- Supabase als Entwicklungsdatenbank
- Supabase Storage für Medien
- Service-Dateien pro Modul
- Gemeinsame Repository-Helfer für einfache Datenoperationen
- Zentrales Löschmodul über `remove_entity()`

## Datenfluss

```text
UI-Komponente
→ Formular oder Aktion
→ Modul-Service
→ Supabase Query oder RPC
→ Datenbank
```

## Grundregel

Komponenten sollen keine komplexe Datenbanklogik enthalten. Diese gehört in Services, Helper oder RPC-Funktionen.
