"use client";

import { useState } from "react";
import { matchesActiveStatus, matchesSearch } from "@/components/admin/utils/list";
import TeamFilters from "./components/TeamFilters";
import TeamCard from "./components/TeamCard";
import TeamEmptyState from "./components/TeamEmptyState";

function getTeamGroup(team) {
  const value = `${team.age_group || ""} ${team.name_de || ""}`.toLowerCase();

  if (value.includes("damen")) return "damen";
  if (value.includes("senioren") || value.includes("herren")) return "senioren";

  return "jugend";
}

function matchesFilter(team, filter) {
  if (filter === "alle") return true;
  if (filter === "fussball-de") {
    return Boolean(team.fussball_de_matches_widget_id || team.fussball_de_table_widget_id);
  }
  if (filter === "jugend" || filter === "senioren" || filter === "damen") {
    return getTeamGroup(team) === filter;
  }

  return matchesActiveStatus(team, filter);
}

export default function AdminTeamsList({ teams = [] }) {
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const filteredTeams = teams.filter((team) => {
    return (
      matchesFilter(team, filter) &&
      matchesSearch(
        [
          team.name_de,
          team.name_en,
          team.age_group,
          team.season,
          team.training_times_de,
          team.contact_name,
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
