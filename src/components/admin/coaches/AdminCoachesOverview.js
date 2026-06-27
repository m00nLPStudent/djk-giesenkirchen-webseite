"use client";

import { useState } from "react";
import AdminCoachesList from "./AdminCoachesList";
import CoachStats from "./components/CoachStats";
import CoachTeamsOverview from "./components/CoachTeamsOverview";
import { getCoachStats } from "./utils/coachStats";

const filterTitles = {
  alle: "Alle Trainer & Betreuer",
  trainer: "Trainer",
  "co-trainer": "Co-Trainer",
  betreuer: "Betreuer",
  mannschaften: "Mannschaften",
};

export default function AdminCoachesOverview({ coaches = [] }) {
  const [activeStatsFilter, setActiveStatsFilter] = useState("alle");
  const stats = getCoachStats(coaches);

  function handleStatsFilter(filter) {
    setActiveStatsFilter((current) => (current === filter ? "alle" : filter));
  }

  return (
    <>
      <CoachStats
        {...stats}
        activeFilter={activeStatsFilter}
        onFilterChange={handleStatsFilter}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
            Übersicht
          </p>
          <h2 className="mt-2 text-2xl font-black">
            {filterTitles[activeStatsFilter] || filterTitles.alle}
          </h2>
        </div>

        {activeStatsFilter !== "alle" && (
          <button
            type="button"
            onClick={() => setActiveStatsFilter("alle")}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Auswahl zurücksetzen
          </button>
        )}
      </div>

      {activeStatsFilter === "mannschaften" ? (
        <CoachTeamsOverview coaches={coaches} />
      ) : (
        <AdminCoachesList coaches={coaches} activeStatsFilter={activeStatsFilter} />
      )}
    </>
  );
}
