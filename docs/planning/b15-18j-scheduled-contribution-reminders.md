# B15.18J – Zeitgesteuerte Beitragserinnerungen

## 1–4. Ziel, Sofortmeldungen und Bestand
Die bestehenden unmittelbaren Typen für Beitrag, Zahlung und Mitgliederstatus bleiben unverändert. `player_contributions.due_date` ist das Fälligkeitsfeld. Der Restbetrag ist `max(0, amount_due - amount_paid - amount_waived)` beziehungsweise das bestehende `amount_outstanding`. Status: `open`, `partially_paid`, `paid`, `deferred`, `exempt`, `canceled`; Stundungsende: `deferred_until`.

## 5–9. Fälligkeit, Stufen und Ausschlüsse
Eine zentrale reine Klassifikation wurde vorbereitet. Sie akzeptiert Erinnerungsstufen als Parameter; im Projekt existiert keine fachlich freigegebene Fristenkonfiguration. Die beispielhaften 14/7/-7/-21 Tage werden ausschließlich in Tests verwendet und nicht produktiv behauptet. Bezahlt, befreit, storniert, archiviert, inaktive Mitglieder, ungültige Daten und Restbetrag <= 0 werden ausgeschlossen. Teilzahlungen verwenden den tatsächlichen Restbetrag. Aktive Stundungen werden bis `deferred_until` unterdrückt.

## 10–13. Scheduler, Sicherheit, Zeitzone und Dispatcher
Es wurde keine vorhandene Cron-, Queue-, Vercel- oder pg_cron-Infrastruktur gefunden. Ebenso fehlen freigegebene Intervalle, Laufzeit und ein nachgewiesenes Deploymentziel. Deshalb wurden weder öffentliche Route noch Browserjob oder Dispatcher erfunden. Scheduler und produktive Zustellung sind `BLOCKED`. Die Datumsbasis `Europe/Berlin` ist als testbare Funktion vorhanden.

## 14–18. Empfänger, Preferences und Idempotenz
Der bestehende Finanzresolver bleibt maßgeblich; Trainer dürfen nur über den bestehenden saisonalen Teamresolver und mit Detail-only-Route adressiert werden. Neue optionale Preference-Typen: `membership_payment_due_soon`, `membership_payment_due_today`, `membership_payment_partial_open`, `membership_payment_deferral_ending`; Überfälligkeit verwendet `membership_payment_overdue`. Der vorbereitete Schlüssel trennt Typ, Beitrag, Stufe und Empfänger. B15.18I weist weiterhin auf die nicht atomare Parallelitätslücke hin.

## 19–23. Audit, Fehler, Datenschutz, Tests und SQL
Ohne Dispatcher entstehen keine neuen Auditzeilen. Ein späterer Lauf muss ausschließlich technische Summen auditieren, Einzelfehler isolieren und global kontrolliert abbrechen. Trainer- und Auditdaten dürfen keine Beträge, Zahlungsarten, Referenzen, Gründe oder Notizen enthalten. Core-, Datums-, Ausschluss-, Stundungs- und Idempotenztests sind vorhanden. Für J war kein zusätzliches SQL-File fachlich begründbar; SQL wurde nicht ausgeführt.

## 24–26. Risiken, Abnahmeplan und Empfehlung
Blocker: Schedulerplattform, Cron-Authentifizierung/Secret-Bereitstellung, Vereinsfreigabe der Stufen und Uhrzeit. Nach Freigabe: zentrale Konfiguration festlegen, geschützten Serverjob implementieren, bestehenden Batchresolver/Notification-Service verwenden und den dokumentierten 20-Schritte-Stagingtest ausführen. Nächster Projektblock sollte diese vier Entscheidungen ausdrücklich liefern.
