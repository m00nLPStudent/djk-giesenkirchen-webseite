"use client";

import { useState } from "react";
import Link from "next/link";

function getTeamGroup(team) {
  const group = (team.age_group || "").toLowerCase();

  if (group.includes("senioren")) {
    return "senioren";
  }

  return "jugend";
}

export default function AdminTeamsList({ teams }) {
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const filteredTeams = teams?.filter((team) => {
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
      <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          {[
            ["alle", "Alle"],
            ["aktiv", "Aktiv"],
            ["inaktiv", "Inaktiv"],
            ["jugend", "Jugend"],
            ["senioren", "Senioren"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                filter === value
                  ? "bg-red-600 text-white"
                  : "border border-white/10 text-white/60 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Mannschaft suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white lg:w-80"
        />
      </div>

      <div className="mt-8 grid gap-5">
        {filteredTeams?.map((team) => (
          <div
            key={team.id}
            className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[180px_1fr]"
          >
            <div className="flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-white/5 p-4">
              {team.team_image_url ? (
                <img
                  src={team.team_image_url}
                  alt={team.name_de}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-sm text-white/40">Kein Bild</span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                  {team.age_group || "Mannschaft"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
                    team.is_active
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {team.is_active ? "Aktiv" : "Inaktiv"}
                </span>

                <span className="text-sm text-white/40">
                  {team.season || "Keine Saison"}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-black">{team.name_de}</h2>

              <p className="mt-3 max-w-3xl text-white/60">
                {team.training_times_de || "Keine Trainingszeiten hinterlegt."}
              </p>

              <div className="mt-5 flex gap-3">
                <Link
                  href={`/admin/teams/edit/${team.id}`}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70"
                >
                  Bearbeiten
                </Link>

                <Link
                  href={`/fussball/${team.slug}`}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70"
                >
                  Ansehen
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
