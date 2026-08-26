# Supabase Storage

## Aktueller Stand

Die zentrale Medienarchitektur verwendet `media_assets` als Metadatenregister und `media_asset_usages` für fachliche Verwendungen. Bilder und Dokumente werden über serverseitige Media-Services hochgeladen, validiert und aufgelöst. MIME-Typ, Dateigröße und Dateisignatur werden zentral geprüft.

Fachintegrationen verwenden zentrale Media-IDs und behalten Legacy-URLs nur als dokumentierten Fallback. Zuordnungen laufen über den gehärteten Assignment-Pfad; verwendete Assets sind vor Archivierung geschützt.

Ältere fachliche Buckets, insbesondere für News- und Event-Dokumente, können für Legacy-Datensätze weiterhin gelesen werden. Neue zentrale Uploads dürfen nicht wieder auf direkte Browser-Storage-Schreibpfade zurückfallen.

## Sichtbarkeit

- `public`: öffentlich auflösbar und für berechtigte Fachbearbeiter auswählbar.
- `admin`: nur im autorisierten Admin-Kontext; Fachpicker erlauben dies für Superadmin/Webmaster.
- `restricted`: nur über ausdrücklich autorisierte Resolver, nicht pauschal in Fachpickern.

Service-Role-Schlüssel bleiben ausschließlich in `server-only`-Code. RLS-/Grant- und Storage-Änderungen benötigen einen gesonderten Security-Block.
