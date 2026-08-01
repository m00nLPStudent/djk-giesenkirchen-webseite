export function mapTeamRosterPlayers(assignments = []) {
  const uniquePlayers = new Map();

  (assignments || []).forEach((assignment) => {
    const player = assignment?.players;
    if (!player?.id) return;

    const mappedPlayer = {
      ...player,
      shirt_number: assignment.shirt_number ?? null,
      position_de: assignment.position_de || "",
      position_en: assignment.position_en || "",
      is_captain: assignment.is_captain ?? false,
      is_active: player.is_active ?? true,
      sort_order: assignment.sort_order ?? null,
    };

    if (mappedPlayer.is_active === false || uniquePlayers.has(mappedPlayer.id)) {
      return;
    }

    uniquePlayers.set(mappedPlayer.id, mappedPlayer);
  });

  return [...uniquePlayers.values()];
}
