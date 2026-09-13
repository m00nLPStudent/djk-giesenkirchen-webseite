# Priority 7 – Media-/Storage-Cleanup-Ausführungsplan

Status: **COMPLETE – MANIFEST CLEANUP EXECUTED / FOUNDATION VERIFIED**

## Ausgangslage und Live-Inventar

Die read-only Service-Role-Inventur vom 13.09.2026 bestätigt 33 `media_assets`, 11 `media_asset_usages`, 109 Storage-Objekte und fünf unverändert zu erhaltende Buckets. Alle 33 Assetzeilen besitzen ihr erwartetes Storage-Objekt; 76 Storage-Objekte besitzen keine Assetzeile. Die Bucket-Verteilung ist: `events-documents` 0, `media` 74, `media-library-private` 10, `media-library-public` 23 und `news-documents` 2.

Das vollständige Manifest liegt wegen personenbezogener Legacy-Dateinamen ausschließlich privat unter `.local/priority7-media-storage/manifest-private.json`. Es wird nicht versioniert. Sein SHA-256 lautet `6c0680adaa5a114583077fd8269384fdfae4846c43b25488d8884248f5980434`; jede spätere Ausführung muss exakt diesen privaten Stand oder ein nach erneutem Preflight bewusst freigegebenes Ersatzmanifest verwenden. Im Repository stehen nur Zählwerte, dieser Integritätshash und der reproduzierbare Read-only-Preflight.

## Keep-Foundation

Erhalten bleiben exakt ein Auth-User samt aktivem Superadmin-Profil und Rollenbindung, 13 Rollen, 64 Permissions, 249 Role-Permission-Zuordnungen, vier Departments, zwei Seasons und 25 Auditzeilen. Die fünf Storage-Buckets sowie alle statischen Repository-Assets – insbesondere `public/images/club-logo.png` – bleiben erhalten.

## Klassifikation

- Assets: 10 `DELETE BUSINESS ASSET`, 23 `DELETE ORPHAN ASSET`, 0 `KEEP SYSTEM ASSET`, 0 vorläufig blockiert.
- Usages: eine fachliche Avatar-Usage und zehn verwaiste Usages zu im Core-Cleanup entfernten Eltern; keine Usage verweist auf eine andere Keep-Foundation.
- Storage: 33 `DB ASSET + STORAGE OBJECT`, 0 DB-Assets ohne Objekt, 76 Storage-Objekte ohne Assetzeile.
- Die 76 direkten Legacy-Objekte werden erst nach leerem `P7M.07_LEGACY_REFERENCE_CHECK` freigegeben. Ordner-Platzhalter sind keine Bucket-Foundation und dürfen manifestgestützt entfernt werden; die Buckets selbst niemals.

## Avatar-Vertrag

Der Betreiber hat den Verlust des derzeitigen Superadmin-Avatars freigegeben. `admin_profiles.profile_image_media_asset_id` ist nullable und der dokumentierte FK verwendet `ON DELETE SET NULL`. Vor einer Löschung muss `P7M.08` diesen Vertrag live erneut bestätigen. Profil, Auth-User, Rollenbindung und Login bleiben erhalten; ausschließlich Referenz, Usage und Datei werden entfernt.

## Bestehender Löschvertrag

Die Medienbibliothek bietet Upload, serverseitige atomare Zuordnung und Archivierung, aber keinen vollständigen Hard-Delete-Service. `synchronize_media_assignment` koordiniert Fach-FK und Usage. Storage-Löschung und DB-Löschung sind getrennt. Der alte allgemeine `removeStorageFiles`-Helper nutzt zwar `storage.from(bucket).remove(paths)`, ist aber browsergebunden und für diesen privilegierten Cleanup nicht geeignet. Die spätere einmalige Ausführung muss einen server-only Admin-Client verwenden und jedes Objekt aus dem privaten Manifest einzeln beziehungsweise in eng begrenzten Bucket-Chunks entfernen.

## Geplante Reihenfolge

1. Read-only Preflight vollständig manuell ausführen; alle zehn Resultsets sichern.
2. Foundation-, Avatar-, Legacy- und Manifest-Counts exakt prüfen; bei Abweichung stoppen.
3. Operator bestätigt ausdrücklich das private Manifest und den irreversiblen Verlust aller Testmedien/Storage-Binärdaten.
4. Fachreferenzen einschließlich Superadmin-Avatar über den bestehenden Assignment-Vertrag auf `NULL` setzen; verwaiste Usages kontrolliert entfernen.
5. Die 33 zu Assetzeilen gehörenden Storage-Objekte per serverseitiger Storage API aus exakt dem Manifest entfernen.
6. Erst nach erfolgreicher Storage-Entfernung die 33 Assetzeilen manifestgestützt entfernen.
7. Die 76 bestätigten, referenzlosen Storage-Orphans separat per Storage API entfernen.
8. Read-only Postcheck vollständig ausführen und Website/Dashboard auf saubere Leerzustände prüfen.

DB und Storage bilden keine gemeinsame Transaktion. Deshalb erfolgt die irreversible Ausführung sequentiell, fail-closed und mit Zwischenprüfungen; keine Wildcards, Bucket-Löschung oder direkten Deletes auf `storage.objects`.

## Stop Conditions

Stop bei abweichenden Foundation-Counts, nicht exakt 33 klassifizierten Assets oder 11 Usages, fehlendem Storage-Objekt zu einem Asset, einer unbekannten Usage, einer Legacy-Referenz, einem echten Systemasset, einem anderen Avatar-FK-Vertrag, weniger/mehr als fünf Buckets oder einem nicht zum privaten Manifest passenden Hash/Count.

## Ausführungsergebnis

Der Betreiber hat den irreversiblen Verlust sämtlicher Testmedien ausdrücklich
freigegeben. Der manifestbasierte Lauf wurde am 13.09.2026 strikt sequenziell
ausgeführt: 11 Usages einschließlich der Avatar-Zuordnung, 33 zu Assetzeilen
gehörende Storage-Objekte, 33 Assetzeilen und anschließend 76 bestätigte
Storage-Orphans wurden entfernt. Es gab keinen Retry und keinen Teilfehler.

Der finale technische Check bestätigt `media_assets = 0`,
`media_asset_usages = 0`, `storage.objects = 0` und weiterhin fünf Buckets.
Auth-User, aktives Superadmin-Profil und Rollenbindung bestehen jeweils exakt
einmal; das Avatarfeld ist `NULL`. Rollen 13, Permissions 64,
Role-Permission-Zuordnungen 249, Departments 4, Seasons 2 und Notification
Audit 25 sind unverändert. Es wurde kein direktes SQL auf `storage.objects`
ausgeführt und kein Bucket gelöscht.

## Recovery und Freigabe

Der vorhandene Core-Dump enthält keine Storage-Binärdaten. Der Betreiber hat
den endgültigen Verlust der Testmedien ausdrücklich akzeptiert. Der private
Manifeststand bleibt für den Abschlussnachweis git-ignoriert erhalten.
Aktueller Status: **CLEANUP COMPLETE / FINAL PRIORITY 7 POSTCHECK PASSED**.

## Finales manuelles Abschluss-Gate

Nach bestandenem SQL-Gesamtpostcheck bleiben drei manuelle Prüfungen:

- **MANUAL CHECK A:** Über die normale Login-Seite als Superadmin anmelden.
- **MANUAL CHECK B:** `/admin/profile` öffnen. Dashboard und Profil müssen ohne
  altes Avatarbild und ohne Fehler laden; Superadmin-Berechtigungen bleiben aktiv.
- **MANUAL CHECK C:** `/`, `/fussball`, `/tischtennis`, `/kontakt`,
  `/behindertensport` und `/damen-gymnastik` kurz öffentlich prüfen.

Alle drei manuellen Prüfungen wurden vom Betreiber erfolgreich bestätigt.
Priority 7 ist damit insgesamt abgeschlossen.
