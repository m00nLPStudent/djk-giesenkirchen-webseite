"use client";

import { useState } from "react";
import CoachFilters from "./components/CoachFilters";
import CoachCard from "./components/CoachCard";
import CoachEmptyState from "./components/CoachEmptyState";

export default function AdminCoachesList({ coaches = [] }) {
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const filteredCoaches = coaches.filter((coach) => {
    const matchesFilter =
      filter === "alle" ||
      (filter === "aktiv" && coach.is_active) ||
      (filter === "inaktiv" && !coach.is_active);

    const searchText =
      `${coach.name} ${coach.role} ${coach.email} ${coach.team_name}`.toLowerCase();

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
