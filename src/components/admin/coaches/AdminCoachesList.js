"use client";

import { useState } from "react";
import CoachFilters from "@/components/admin/coaches/components/CoachFilters";
import CoachCard from "@/components/admin/coaches/components/CoachCard";
import CoachEmptyState from "@/components/admin/coaches/components/CoachEmptyState";
import { matchesActiveStatus, matchesSearch } from "@/components/admin/utils/list";
import { getEntityTeam } from "@/components/admin/utils/entity";
import { filterCoachesByStats } from "./utils/coachStats";

export default function AdminCoachesList({
  coaches = [],
  activeStatsFilter = "alle",
}) {
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const statFilteredCoaches = filterCoachesByStats(coaches, activeStatsFilter);

  const filteredCoaches = statFilteredCoaches.filter((coach) => {
    const team = getEntityTeam(coach);

    return (
      matchesActiveStatus(coach, filter) &&
      matchesSearch([coach.name, coach.role, coach.email, team.name], search)
    );
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
