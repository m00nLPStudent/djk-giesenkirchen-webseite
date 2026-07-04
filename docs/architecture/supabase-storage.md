# Supabase Storage

Storage-Struktur und operative Hinweise.

## Verwendete Buckets

- media: allgemeine Bilder/Assets
- news-documents: Anhänge für News

## Aktuelles Verhalten

- Upload und Löschlogik laufen über Hilfen in src/lib/storage.js.
- Dateiformat-/Dokumentenregeln laufen über src/lib/files.js.

## Sicherheits-Hinweis

- Für Upload/Update/Delete müssen RLS-Policies zur tatsächlichen Rollenlogik passen.
- Keine Secrets oder Service-Keys in Dokumentation ablegen.
