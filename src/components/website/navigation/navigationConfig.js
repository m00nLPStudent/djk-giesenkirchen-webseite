export const publicNavigationItems = [
  { label: "Startseite", href: "/" },
  {
    label: "Verein",
    href: "/verein",
    children: [
      { label: "Vorstand Gesamtverein", href: "/verein/vorstand" },
      { label: "Vereinsgeschichte", href: "/verein/vereinsgeschichte" },
      { label: "Termine", href: "/termine/allgemein" },
      { label: "News", href: "/news/uebersicht" },
      { label: "Downloads", href: "/downloads" },
    ],
  },
  {
    label: "Fußball",
    href: "/fussball",
    children: [
      { label: "Mannschaften", href: "/fussball/mannschaften" },
      { label: "Trainer", href: "/fussball/abteilung/trainer" },
      { label: "Vorstand Fußball", href: "/fussball/abteilung/vorstand" },
      { label: "Trainingszeiten", href: "/termine/training" },
      { label: "Turniere & Events", href: "/fussball/turniere-events" },
    ],
  },
  {
    label: "Tischtennis",
    href: "/tischtennis",
    children: [
      { label: "Mannschaften", href: "/tischtennis/mannschaften" },
      { label: "Spielplan & Tabelle", href: "/tischtennis/spielplan-tabelle" },
      { label: "Vorstand", href: "/tischtennis/vorstand" },
      { label: "Trainingszeiten", href: "/tischtennis/trainingszeiten" },
    ],
  },
  { label: "Gymnastikdamen", href: "/damen-gymnastik" },
  { label: "Behindertensport", href: "/behindertensport" },
  { label: "Kontakt", href: "/kontakt" },
  { label: "Mitglied werden", href: "/mitglied-werden", cta: true },
  { label: "Sponsoren", href: "/fussball/sponsoren" },
];

export function isNavigationPathActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavigationItemActive(pathname, item) {
  return (
    isNavigationPathActive(pathname, item.href) ||
    item.children?.some((child) =>
      isNavigationPathActive(pathname, child.href),
    ) === true
  );
}
