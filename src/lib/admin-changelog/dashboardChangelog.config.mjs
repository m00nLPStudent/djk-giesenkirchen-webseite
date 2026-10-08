export const CURRENT_DASHBOARD_CHANGELOG = Object.freeze({
  version: "1.0.14",
  releaseDate: "2026-10-08",
  title: "Neu im Dashboard",
  entries: Object.freeze([
    Object.freeze({
      title: "Erweiterung der Footer-Navigation",
      description:
        "Die öffentliche Vereinswebseite verlinkt im Footer jetzt zusätzlich den Heimatverein und den Gewerbekreis Giesenkirchen. Beide Partnerseiten öffnen sich in einem neuen Browser-Tab; die bestehenden Footer-Links und das responsive Design bleiben unverändert.",
    }),
  ]),
  previousReleases: Object.freeze([
    Object.freeze({
      version: "1.0.13",
      releaseDate: "2026-09-29",
      entries: Object.freeze([
        Object.freeze({
          title: "Neuer Supportbereich",
          description:
            "Berechtigte Benutzer können Supporttickets mit Kategorie und zuständigem Bereich erstellen, ihre eigenen Tickets und deren Status einsehen und direkt im Ticketverlauf antworten.",
        }),
        Object.freeze({
          title: "Übersichtlicher Bearbeitungsstand",
          description:
            "Tickets durchlaufen die Status Offen, In Bearbeitung, Wartet auf Rückmeldung und Abgeschlossen. Relevante Änderungen werden zusätzlich im Dashboard angekündigt.",
        }),
        Object.freeze({
          title: "Supportverwaltung",
          description:
            "Superadmins können Supporttickets priorisieren, zuweisen, beantworten und abgeschlossene Tickets bei Bedarf kontrolliert wieder öffnen. E-Mail-Benachrichtigungen sind technisch vorbereitet und werden erst nach dem kontrollierten Live-Test aktiviert.",
        }),
      ]),
    }),
    Object.freeze({
      version: "1.0.12",
      releaseDate: "2026-09-27",
      entries: Object.freeze([
        Object.freeze({
          title: "Tischtennis – News & Termine",
          description:
            "Der Tischtennisvorstand kann News und Termine der Tischtennisabteilung vollständig verwalten. Die Inhalte bleiben dabei sauber auf die eigene Abteilung begrenzt.",
        }),
        Object.freeze({
          title: "Kassierer-Berechtigungen",
          description:
            "Die Berechtigungen des Kassierers wurden präzisiert. Die vollständige Beitragsverwaltung bleibt erhalten, während allgemeine Seiten- und Vereinseinstellungen nicht zu seinem Arbeitsbereich gehören.",
        }),
      ]),
    }),
  ]),
});
