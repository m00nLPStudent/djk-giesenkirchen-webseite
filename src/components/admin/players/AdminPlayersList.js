"use client";

import { useState } from "react";
import PlayerFilters from "./components/PlayerFilters";
import PlayerCard from "./components/PlayerCard";
import PlayerEmptyState from "./components/PlayerEmptyState";

export default function AdminPlayersList({ players = [] }) {
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const filteredPlayers = players.filter((player) => {
    const text = String(player.first_name || "") + " " + String(player.last_name || "") + " " + String(player.name_de || "") + " " + String(player.position || "") + " " + String(player.jersey_number || "") + " " + String(player.teams?.name_de || "");
    const position = String(player.position || "").toLowerCase();
    const matchesSearch = text.toLowerCase().includes(search.toLowerCase());

    if (filter === "aktiv" && !player.is_active) return false;
    if (filter === "pausiert" && player.is_active) return false;
    if (filter === "torwart" && !position.includes("tor")) return false;
    if (filter === "feldspieler" && position.includes("tor")) return false;

    return matchesSearch;
  });

  return (
    <>
      <PlayerFilters filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
      {filteredPlayers.length === 0 ? <PlayerEmptyState /> : <div className="space-y-5">{filteredPlayers.map((player) => <PlayerCard key={player.id} player={player} />)}</div>}
    </>
  );
}
