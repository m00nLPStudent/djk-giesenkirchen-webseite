"use client";

import { useState } from "react";
import TeamFilters from "./components/TeamFilters";
import TeamCard from "./components/TeamCard";
import TeamEmptyState from "./components/TeamEmptyState";

function getTeamGroup(team) {
  const group = (team.age_group || "").toLowerCase();

  if (group.includes("senioren")) {
    return "senioren";
  }

  return "jugend";
}

export default function AdminTeamsList({ teams = [] }) {
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const filteredTeams = teams.filter((team) => {
    const group = getTeamGroup(team);

    const matchesFilter =
      filter === "alle" ||
      (filter === "aktiv" && team.is_active) ||
      (filter === "inaktiv" && !team.is_active) ||
      filter === group;

    const searchText =
      `${team.name_de} ${team.age_group} ${team.season} ${team.training_times_de}`.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <TeamFilters
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
      />

      {filteredTeams.length === 0 ? (
        <TeamEmptyState />
      ) : (
        <div className="space-y-5">
          {filteredTeams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </>
  );
}
