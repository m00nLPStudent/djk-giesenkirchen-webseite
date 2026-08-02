# B15.10A – News-Autor und Medienvorschau

## 1. Ziel

Das B15.10-Layout erhält kompakte Statuschips, eine serverseitige Autorregel, eine ausschließlich deutsche Adminpflege sowie sichere Vorschauen für vorhandene Bilder und Dokumente.

## 2. Root Cause Status

`NewsStatusBadge` verwendete zwar `AdminStatusChip`, aber dessen normale Variante mit größeren horizontalen Abständen und weiter Buchstabenlaufweite. Alle drei vorhandenen Zustände verwenden jetzt `compact`.

## 3. Kompakter Status

Entwurf, Geplant und Veröffentlicht werden als `AdminStatusChip compact` dargestellt. Ein Status Archiviert existiert im aktuellen News-Datenmodell nicht und wurde nicht erfunden.

## 4. Bisheriger Autor

`createNewsPayload` setzte bei neuen Datensätzen `author` fest auf „DJK/VfL Giesenkirchen“. Das Feld war clientseitig erzeugt und enthielt keine verknüpfte Profil-ID.

## 5. Neue Autorregel

Bei neuen News ist der im vorhandenen Textfeld gespeicherte Autor der ursprüngliche angemeldete Ersteller. Bevorzugt wird `admin_profiles.full_name`, danach die Profil-E-Mail und schließlich „Unbekannter Autor“.

## 6. Serverseitige Autorzuordnung

`saveNewsWithAuthorAction` prüft serverseitig `news.create` oder `news.edit`. Create lädt `full_name` und `email` über die bereits authentifizierte Profil-ID. Autor- und EN-Werte aus dem Client-Payload werden verworfen. Beim Edit wird der vorhandene Autor geladen und unverändert zurückgeschrieben.

## 7. Bestandsdaten

Vorhandene `news.author`-Texte bleiben unverändert sichtbar, einschließlich des früher gespeicherten Vereinsnamens. Fehlt der Wert, erscheint „Autor nicht hinterlegt“. Es gibt keinen Backfill.

## 8. Englische Felder

Englischer Titel, Teaser und Inhalt wurden aus Form-State, Eingaben, Inhaltsansicht und Admin-Detailzusammenfassung entfernt. Update-Payloads enthalten diese Felder nicht; vorhandene EN-Daten werden daher nicht geleert oder überschrieben. Datenbank und öffentliche Seiten bleiben unverändert.

## 9. Bildvorschau

Das vorhandene Einzelbild wird im Medienbereich als `object-cover`-Thumbnail mit sicher abgeleitetem Dateinamen gezeigt. Fehlerhafte URLs wechseln lokal in einen neutralen Fallback. Die Übersicht enthält bewusst kein interaktives Thumbnail, um verschachtelte Interaktionen in vollständig klickbaren Zeilen und Karten zu vermeiden.

## 10. Dokumentanzeige

Alle bereits unterstützten Dokumente werden kompakt mit Icon, Dateiname, MIME-Typ, optionaler Größe sowie den vorhandenen Bearbeiten- und Entfernen-Funktionen dargestellt.

## 11. Dokumentöffnung

Dokumente öffnen über die bestehende `file_url` in einem neuen Tab mit `noopener noreferrer`. Es wird kein Dokument in ein `iframe` eingebettet. Der Name stammt zuerst aus `file_name`, andernfalls URL-dekodiert aus dem Pfad ohne Queryparameter.

## 12. Permissions

Create und Edit werden serverseitig mit den bestehenden News-Permissions geschützt. Medien sind nur innerhalb der bereits geschützten Admin-News-Seite sichtbar. Es wurden keine Keys oder Scopes verändert.

## 13. Accessibility

Der Bildtrigger besitzt ein verständliches Label, der Dialog einen Titel und der native Dialog übernimmt Fokusbegrenzung und Escape. Backdrop und Schließen-Button schließen die Vorschau; anschließend wird der Fokus zurückgegeben. Dokumentlinks sind echte Links.

## 14. Responsive

Thumbnail und Dateiname brechen kontrolliert um. Die Großansicht ist auf 94 Viewport-Prozent Breite und 92 Viewport-Prozent Höhe begrenzt. Statuschips bleiben ohne Mindestbreite kompakt.

## 15. Tests

Geprüft werden Statusvarianten, Autor-Fallbacks, serverseitige Payload-Bereinigung, Autorenerhalt, EN-Erhalt, Dateinamen, Bildfehler, Dialogbedienung, sichere Dokumentlinks und bestehende Medienmutationen.

## 16. Risiken

Das aktuelle Schema besitzt keine `created_by`- oder `published_by`-Spalte für News. Der Autor wird deshalb manipulationssicher serverseitig, aber nur als Name im bestehenden Textfeld gespeichert. Umbenennungen des Adminprofils ändern ältere Autorenanzeigen nicht.

## 17. Empfohlener nächster Schritt

Falls revisionssichere Autor- und Publisher-Zuordnungen benötigt werden, zunächst einen separaten Datenmodellauftrag für `created_by` und `published_by` mit FK-, RLS-, Backfill- und Auditkonzept erstellen. In B15.10A wurde bewusst keine Migration erzeugt.
