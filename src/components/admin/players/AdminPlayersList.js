"use client";

import { useEffect, useMemo, useState } from "react";
import PlayerFilters from "./components/PlayerFilters";
import PlayerCard from "./components/PlayerCard";
import PlayerEmptyState from "./components/PlayerEmptyState";
import {
  filterPlayers,
  getPlayerPositions,
  getPlayerTeams,
} from "./list/playerList.helpers";

export default function AdminPlayersList({ players = [], initialFilters = {} }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialFilters.statusFilter || "all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [captainFilter, setCaptainFilter] = useState("all");
  const [nationalityFilter, setNationalityFilter] = useState(initialFilters.nationalityFilter || "all");
  const [sortBy, setSortBy] = useState("name_asc");

  useEffect(() => {
    setStatusFilter(initialFilters.statusFilter || "all");
    setNationalityFilter(initialFilters.nationalityFilter || "all");
  }, [initialFilters.statusFilter, initialFilters.nationalityFilter]);

  const teams = useMemo(() => getPlayerTeams(players), [players]);
  const positions = useMemo(() => getPlayerPositions(players), [players]);

  const filteredPlayers = useMemo(
    () =>
      filterPlayers(players, {
        search,
        statusFilter,
        teamFilter,
        genderFilter,
        nationalityFilter,
        positionFilter,
        captainFilter,
        sortBy,
      }),
    [
      players,
      search,
      statusFilter,
      teamFilter,
      genderFilter,
      nationalityFilter,
      positionFilter,
      captainFilter,
      sortBy,
    ],
  );

  return (
    <>
      <PlayerFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        teamFilter={teamFilter}
        setTeamFilter={setTeamFilter}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
        positionFilter={positionFilter}
        setPositionFilter={setPositionFilter}
        captainFilter={captainFilter}
        setCaptainFilter={setCaptainFilter}
        nationalityFilter={nationalityFilter}
        setNationalityFilter={setNationalityFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        teams={teams}
        positions={positions}
        resultCount={filteredPlayers.length}
      />

      {filteredPlayers.length === 0 ? (
        <PlayerEmptyState />
      ) : (
        <div className="space-y-5">
          {filteredPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}
    </>
  );
}
