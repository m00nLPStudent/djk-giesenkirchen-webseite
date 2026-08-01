import ProfileDetailsCard from "@/components/website/profile/ProfileDetailsCard";

const PLAYER_DETAIL_ORDER = [
  "rueckennummer",
  "position",
  "mannschaft",
  "mannschaften",
  "saison",
  "spielfuehrer",
  "geschlecht",
  "geburtsdatum",
  "geburtstag",
  "alter",
  "starker fuss",
  "im verein seit",
];

const HIDDEN_PLAYER_DETAIL_LABELS = [
  "jahrgang",
  "nationalitaet",
];

function normalizeLabel(label = "") {
  return String(label).trim().toLowerCase();
}

function getOrderIndex(item) {
  const label = normalizeLabel(item.label);
  const index = PLAYER_DETAIL_ORDER.indexOf(label);
  return index === -1 ? PLAYER_DETAIL_ORDER.length : index;
}

function getPlayerDetails(stats) {
  return stats
    .filter((item) => !HIDDEN_PLAYER_DETAIL_LABELS.includes(normalizeLabel(item.label)))
    .sort((a, b) => getOrderIndex(a) - getOrderIndex(b));
}

export default function PlayerProfileStatsGrid({ stats = [] }) {
  return (
    <ProfileDetailsCard
      title="Spielerdaten"
      items={getPlayerDetails(stats)}
      columns={3}
    />
  );
}
