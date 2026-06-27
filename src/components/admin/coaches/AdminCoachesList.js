"use client";

import { useState } from "react";
import CoachFilters from "@/components/admin/coaches/components/CoachFilters";
import CoachCard from "@/components/admin/coaches/components/CoachCard";
import CoachEmptyState from "@/components/admin/coaches/components/CoachEmptyState";
import { filterCoachesByStats } from "./utils/coachStats";

export default function AdminCoachesList({
  coaches = [],
  activeStatsFilter = "alle",
}) {
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const statFilteredCoaches = filterCoachesByStats(coaches, activeStatsFilter);

  const filteredCoaches = statFilteredCoaches.filter((coach) => {
    const matchesFilter =
      filter === "alle" ||
      (filter === "aktiv" && coach.is_active) ||
      (filter === "inaktiv" && !coach.is_active);

    const team = Array.isArray(coach.teams) ? coach.teams[0] : coach.teams;
    const teamName = team?.name_de || coach.team_name || "";
    const searchText =
      `${coach.name} ${coach.role} ${coach.email} ${teamName}`.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <CoachFilters
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
      />

      {filteredCoaches.length === 0 ? (
        <CoachEmptyState />
      ) : (
        <div className="space-y-5">
          {filteredCoaches.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      )}
    </>
  );
}
