"use client";

import { useMemo, useState } from "react";
import { AdminInformationRow, AdminListChevron, AdminListHeader, AdminListMobileCard, AdminListRow, AdminModuleCards, AdminModuleList } from "@/components/admin/design-system";
import ContributionStatusBadge from "@/components/admin/contributions/components/ContributionStatusBadge";
import { formatContributionAmount } from "@/components/admin/contributions/helpers/contributionFormatters";
import PlayerAvatar from "./components/PlayerAvatar";
import PlayerEmptyState from "./components/PlayerEmptyState";
import PlayerFilters from "./components/PlayerFilters";
import PlayerStatusBadge from "./components/PlayerStatusBadge";
import { filterPlayers, getPlayerPositions, getPlayerTeams } from "./list/playerList.helpers";

const BASIC_TEMPLATE = "3.5rem minmax(13rem,1.7fr) minmax(10rem,1fr) minmax(7rem,0.8fr) 3rem";
const CONTRIBUTION_TEMPLATE = "3.5rem minmax(12rem,1.45fr) minmax(9rem,0.9fr) minmax(7rem,0.7fr) minmax(11rem,1.1fr) minmax(7rem,0.75fr) 3rem";

function teamLabel(player) {
  return player.primaryAssignment?.teamNameDe || player.primaryTeamName || "Keine Mannschaft";
}

function ContributionCell({ status }) {
  if (!status) return <span className="text-sm text-white/35">–</span>;
  return <div className="flex min-w-0 flex-wrap items-center gap-2"><ContributionStatusBadge status={status.status} isOverdue={status.isOverdue} compact shortLabel={false} />{status.warningCode ? <span className="text-xs text-amber-200/80">Prüfen</span> : null}</div>;
}

function PlayerMobileCard({ player, showContributionStatus }) {
  return (
    <AdminListMobileCard href={`/admin/players/${player.id}`} label={`Details zu ${player.displayName}`}>
      <div className="flex items-start gap-3">
        <PlayerAvatar player={player} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-base font-black text-white sm:text-lg">{player.displayName}</p><p className="mt-1 truncate text-sm text-white/50">{teamLabel(player)}</p></div><AdminListChevron label={`Details zu ${player.displayName}`} /></div>
          <div className="mt-3 flex flex-wrap items-center gap-2"><PlayerStatusBadge active={player.is_active} />{showContributionStatus && player.contributionStatus ? <ContributionStatusBadge status={player.contributionStatus.status} isOverdue={player.contributionStatus.isOverdue} compact shortLabel={false} /> : null}</div>
        </div>
      </div>
      {showContributionStatus ? <dl className="mt-4"><AdminInformationRow label="Offen" align="right" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 sm:grid-cols-[1fr_auto]">{formatContributionAmount(player.contributionStatus?.amountOutstanding || "0.00")}</AdminInformationRow></dl> : null}
    </AdminListMobileCard>
  );
}

export default function AdminPlayersList({ players = [], initialFilters = {}, showContributionStatus = false, search = "" }) {
  const [statusFilter, setStatusFilter] = useState(initialFilters.statusFilter || "active");
  const [teamFilter, setTeamFilter] = useState(initialFilters.teamFilter || "all");
  const [genderFilter, setGenderFilter] = useState(initialFilters.genderFilter || "all");
  const [positionFilter, setPositionFilter] = useState(initialFilters.positionFilter || "all");
  const [captainFilter, setCaptainFilter] = useState(initialFilters.captainFilter || "all");
  const [nationalityFilter, setNationalityFilter] = useState(initialFilters.nationalityFilter || "all");
  const [contributionFilter, setContributionFilter] = useState(initialFilters.contributionFilter || "all");
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || "name_asc");
  const teams = useMemo(() => getPlayerTeams(players), [players]);
  const positions = useMemo(() => getPlayerPositions(players), [players]);
  const filteredPlayers = useMemo(() => filterPlayers(players, { search, statusFilter, teamFilter, genderFilter, nationalityFilter, contributionFilter, positionFilter, captainFilter, sortBy }), [players, search, statusFilter, teamFilter, genderFilter, nationalityFilter, contributionFilter, positionFilter, captainFilter, sortBy]);
  const template = showContributionStatus ? CONTRIBUTION_TEMPLATE : BASIC_TEMPLATE;
  const columns = [{ key: "avatar", label: "Profil" }, { key: "name", label: "Spieler" }, { key: "team", label: "Mannschaft" }, { key: "status", label: "Status" }, ...(showContributionStatus ? [{ key: "contribution", label: "Vereinsbeitrag" }, { key: "open", label: "Offen" }] : []), { key: "details", label: "" }];

  return (
    <div className="space-y-5">
      <PlayerFilters statusFilter={statusFilter} setStatusFilter={setStatusFilter} teamFilter={teamFilter} setTeamFilter={setTeamFilter} genderFilter={genderFilter} setGenderFilter={setGenderFilter} positionFilter={positionFilter} setPositionFilter={setPositionFilter} captainFilter={captainFilter} setCaptainFilter={setCaptainFilter} nationalityFilter={nationalityFilter} setNationalityFilter={setNationalityFilter} contributionFilter={contributionFilter} setContributionFilter={setContributionFilter} showContributionFilter={showContributionStatus} sortBy={sortBy} setSortBy={setSortBy} teams={teams} positions={positions} resultCount={filteredPlayers.length} />
      {!filteredPlayers.length ? <PlayerEmptyState /> : (
        <AdminModuleList
          desktopClassName="hidden overflow-hidden xl:block"
          mobile={<AdminModuleCards className="xl:hidden">{filteredPlayers.map((player) => <PlayerMobileCard key={`${player.id}-mobile`} player={player} showContributionStatus={showContributionStatus} />)}</AdminModuleCards>}
        >
          <AdminListHeader columns={columns} template={template} />
          {filteredPlayers.map((player) => <AdminListRow key={player.id} href={`/admin/players/${player.id}`} label={`Details zu ${player.displayName}`} template={template} className="py-3.5"><PlayerAvatar player={player} sizeClassName="h-10 w-10" /><div className="min-w-0"><p className="truncate font-bold text-white">{player.displayName}</p><p className="mt-1 truncate text-xs text-white/45">{player.yearGroup ? `Jahrgang ${player.yearGroup}` : "Jahrgang offen"}</p></div><span className="truncate text-white/70">{teamLabel(player)}</span><PlayerStatusBadge active={player.is_active} />{showContributionStatus ? <ContributionCell status={player.contributionStatus} /> : null}{showContributionStatus ? <span className="font-bold text-white">{formatContributionAmount(player.contributionStatus?.amountOutstanding || "0.00")}</span> : null}<AdminListChevron label={`Details zu ${player.displayName}`} /></AdminListRow>)}
        </AdminModuleList>
      )}
    </div>
  );
}
