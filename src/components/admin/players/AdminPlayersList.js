"use client";

import { useMemo, useState } from "react";
import PlayerFilters from "./components/PlayerFilters";
import PlayerCard from "./components/PlayerCard";
import PlayerEmptyState from "./components/PlayerEmptyState";

function calculateAge(birthdate) {
  if (!birthdate) return null;

  const birthday = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age = age - 1;
  }

  return age;
}

function sortPlayers(players, sortBy) {
  return [...players].sort((a, b) => {
    const nameA = `${a.last_name || ""} ${a.first_name || ""}`.toLowerCase();
    const nameB = `${b.last_name || ""} ${b.first_name || ""}`.toLowerCase();
    const teamA = (a.teams?.name_de || "").toLowerCase();
    const teamB = (b.teams?.name_de || "").toLowerCase();
    const positionA = (a.position_de || "").toLowerCase();
    const positionB = (b.position_de || "").toLowerCase();
    const ageA = calculateAge(a.birthdate);
    const ageB = calculateAge(b.birthdate);

    if (sortBy === "name_desc") return nameB.localeCompare(nameA);
    if (sortBy === "shirt_number") return (a.shirt_number || 999) - (b.shirt_number || 999);
    if (sortBy === "age_asc") return (ageA ?? 999) - (ageB ?? 999);
    if (sortBy === "age_desc") return (ageB ?? -1) - (ageA ?? -1);
    if (sortBy === "year_group") return String(a.year_group || "9999").localeCompare(String(b.year_group || "9999"));
    if (sortBy === "team") return teamA.localeCompare(teamB) || nameA.localeCompare(nameB);
    if (sortBy === "position") return positionA.localeCompare(positionB) || nameA.localeCompare(nameB);
    if (sortBy === "created_at") return new Date(b.created_at || 0) - new Date(a.created_at || 0);

    return nameA.localeCompare(nameB);
  });
}

export default function AdminPlayersList({ players = [] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [captainFilter, setCaptainFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");

  const teams = useMemo(() => {
    const map = new Map();

    players.forEach((player) => {
      if (player.team_id && player.teams?.name_de) {
        map.set(player.team_id, player.teams.name_de);
      }
    });

    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  const positions = useMemo(() => {
    return [...new Set(players.map((player) => player.position_de).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    const result = players.filter((player) => {
      const text = [
        player.first_name,
        player.last_name,
        player.shirt_number,
        player.position_de,
        player.year_group,
        player.teams?.name_de,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (searchTerm && !text.includes(searchTerm)) return false;
      if (statusFilter === "active" && !player.is_active) return false;
      if (statusFilter === "inactive" && player.is_active) return false;
      if (teamFilter !== "all" && player.team_id !== teamFilter) return false;
      if (genderFilter !== "all" && player.gender !== genderFilter) return false;
      if (positionFilter !== "all" && player.position_de !== positionFilter) return false;
      if (captainFilter === "captain" && !player.is_captain) return false;
      if (captainFilter === "not_captain" && player.is_captain) return false;

      return true;
    });

    return sortPlayers(result, sortBy);
  }, [players, search, statusFilter, teamFilter, genderFilter, positionFilter, captainFilter, sortBy]);

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
