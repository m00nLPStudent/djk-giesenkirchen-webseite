"use client";

import { useState } from "react";
import { matchesActiveStatus, matchesSearch } from "@/components/admin/utils/list";
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
    const matchesGroup = filter === "alle" || filter === group;
    const matchesStatus = matchesActiveStatus(team, filter);

    return (
      (matchesGroup || matchesStatus) &&
      matchesSearch(
        [
          team.name_de,
          team.name_en,
          team.age_group,
          team.season,
          team.training_times_de,
        ],
        search,
      )
    );
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
