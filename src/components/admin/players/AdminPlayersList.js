"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import PlayerFilters from "./components/PlayerFilters";
import PlayerEmptyState from "./components/PlayerEmptyState";
import PlayerStatusBadge from "./components/PlayerStatusBadge";
import ContributionStatusBadge from "@/components/admin/contributions/components/ContributionStatusBadge";
import { formatContributionAmount } from "@/components/admin/contributions/helpers/contributionFormatters";
import {
  filterPlayers,
  getPlayerPositions,
  getPlayerTeams,
} from "./list/playerList.helpers";

function getPlayerTeamLabel(player = {}) {
  return player.primaryAssignment?.teamNameDe || player.primaryTeamName || "Keine Mannschaft";
}

function ContributionCell({ status }) {
  if (!status) {
    return <span className="text-sm text-white/35">-</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <ContributionStatusBadge
        status={status.status}
        isOverdue={status.isOverdue}
        compact
        shortLabel={false}
      />
      {status.warningCode ? (
        <span className="text-xs text-amber-200/80">Pruefen</span>
      ) : null}
    </div>
  );
}

function PlayerMobileCard({ player, showContributionStatus = false }) {
  return (
    <Link
      href={`/admin/players/${player.id}`}
      className="block rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 transition hover:border-red-500/40 hover:bg-white/[0.06] xl:hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-white sm:text-lg">
            {player.displayName}
          </p>
          <p className="mt-1 truncate text-sm text-white/50">
            {getPlayerTeamLabel(player)}
          </p>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-white/35" aria-hidden="true" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PlayerStatusBadge active={player.is_active} />
        {showContributionStatus && player.contributionStatus ? (
          <ContributionStatusBadge
            status={player.contributionStatus.status}
            isOverdue={player.contributionStatus.isOverdue}
            compact
            shortLabel={false}
          />
        ) : null}
      </div>

      {showContributionStatus && player.contributionStatus ? (
        <dl className="mt-4 grid gap-2 text-sm">
          <MobileRow
            label="Offen"
            value={formatContributionAmount(player.contributionStatus.amountOutstanding)}
          />
        </dl>
      ) : null}
    </Link>
  );
}

function MobileRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/42">
        {label}
      </dt>
      <dd className="text-right font-bold text-white">{value}</dd>
    </div>
  );
}

export default function AdminPlayersList({
  players = [],
  initialFilters = {},
  showContributionStatus = false,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    initialFilters.statusFilter || "active",
  );
  const [teamFilter, setTeamFilter] = useState(initialFilters.teamFilter || "all");
  const [genderFilter, setGenderFilter] = useState(
    initialFilters.genderFilter || "all",
  );
  const [positionFilter, setPositionFilter] = useState(
    initialFilters.positionFilter || "all",
  );
  const [captainFilter, setCaptainFilter] = useState(
    initialFilters.captainFilter || "all",
  );
  const [nationalityFilter, setNationalityFilter] = useState(
    initialFilters.nationalityFilter || "all",
  );
  const [contributionFilter, setContributionFilter] = useState(
    initialFilters.contributionFilter || "all",
  );
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || "name_asc");

  const teams = useMemo(() => getPlayerTeams(players), [players]);
  const positions = useMemo(() => getPlayerPositions(players), [players]);

  const filteredPlayers = useMemo(
    () =>
      filterPlayers(players, {
        search,
        statusFilter,
        teamFilter,
        genderFilter,
        nationalityFilter,
        contributionFilter,
        positionFilter,
        captainFilter,
        sortBy,
      }),
    [
      players,
      search,
      statusFilter,
      teamFilter,
      genderFilter,
      nationalityFilter,
      contributionFilter,
      positionFilter,
      captainFilter,
      sortBy,
    ],
  );

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
        nationalityFilter={nationalityFilter}
        setNationalityFilter={setNationalityFilter}
        contributionFilter={contributionFilter}
        setContributionFilter={setContributionFilter}
        showContributionFilter={showContributionStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        teams={teams}
        positions={positions}
        resultCount={filteredPlayers.length}
      />

      {filteredPlayers.length === 0 ? (
        <PlayerEmptyState />
      ) : (
        <div className="space-y-4">
          {filteredPlayers.map((player) => (
            <PlayerMobileCard
              key={`${player.id}-mobile`}
              player={player}
              showContributionStatus={showContributionStatus}
            />
          ))}

          <div className="hidden overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] xl:block">
            <div
              className={`grid gap-4 border-b border-white/10 px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/42 ${
                showContributionStatus
                  ? "grid-cols-[minmax(14rem,1.5fr)_minmax(9rem,1fr)_minmax(7rem,0.8fr)_minmax(12rem,1.15fr)_minmax(7rem,0.8fr)_3rem]"
                  : "grid-cols-[minmax(16rem,1.7fr)_minmax(10rem,1fr)_minmax(7rem,0.8fr)_3rem]"
              }`}
            >
              <span>Spieler</span>
              <span>Mannschaft</span>
              <span>Status</span>
              {showContributionStatus ? <span>Vereinsbeitrag</span> : null}
              {showContributionStatus ? <span>Offen</span> : null}
              <span />
            </div>

            <div>
              {filteredPlayers.map((player) => (
                <Link
                  key={player.id}
                  href={`/admin/players/${player.id}`}
                  className={`grid items-center gap-4 border-t border-white/10 px-5 py-3.5 text-sm transition hover:bg-white/[0.05] ${
                    showContributionStatus
                      ? "grid-cols-[minmax(14rem,1.5fr)_minmax(9rem,1fr)_minmax(7rem,0.8fr)_minmax(12rem,1.15fr)_minmax(7rem,0.8fr)_3rem]"
                      : "grid-cols-[minmax(16rem,1.7fr)_minmax(10rem,1fr)_minmax(7rem,0.8fr)_3rem]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{player.displayName}</p>
                    <p className="mt-1 truncate text-xs text-white/45">
                      {player.yearGroup ? `Jahrgang ${player.yearGroup}` : "Jahrgang offen"}
                    </p>
                  </div>

                  <span className="truncate text-white/70">{getPlayerTeamLabel(player)}</span>
                  <div className="min-w-0">
                    <PlayerStatusBadge active={player.is_active} />
                  </div>

                  {showContributionStatus ? (
                    <ContributionCell status={player.contributionStatus} />
                  ) : null}

                  {showContributionStatus ? (
                    <span className="font-bold text-white">
                      {formatContributionAmount(
                        player.contributionStatus?.amountOutstanding || "0.00",
                      )}
                    </span>
                  ) : null}

                  <span className="flex justify-end text-white/35">
                    <ChevronRight size={18} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
