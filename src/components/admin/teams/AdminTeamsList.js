"use client";

import { AdminListChevron, AdminListHeader, AdminListMobileCard, AdminListRow, AdminMetric, AdminModuleCards, AdminModuleList, AdminModuleSummary, AdminStatusChip } from "@/components/admin/design-system";
import { formatContributionAmount } from "@/components/admin/contributions/helpers/contributionFormatters";
import TeamEmptyState from "./components/TeamEmptyState";
import useTeamScope from "./useTeamScope";

const TEMPLATE = "minmax(13rem,1.35fr) minmax(8rem,0.75fr) minmax(7rem,0.65fr) 6rem 6rem minmax(12rem,1fr) 3rem";

function ContributionSummary({ summary }) {
  if (!summary) return <span className="text-white/35">–</span>;
  return <span className="text-xs leading-5 text-white/65">{summary.openCount} offen · {summary.overdueCount} überfällig · {formatContributionAmount(summary.totalOutstanding)}</span>;
}

function TeamMobileCard({ team, showContributionSummary }) {
  return <AdminListMobileCard href={`/admin/teams/${team.id}`} label={`Details zu ${team.name_de}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-lg font-black text-white">{team.name_de}</p><p className="mt-1 text-sm text-white/50">{team.age_group || "Mannschaft"} · {team.public_season_name || "Keine Saison"}</p></div><AdminListChevron label={`Details zu ${team.name_de}`} /></div><div className="mt-3 flex flex-wrap gap-2"><AdminStatusChip variant={team.is_active === false ? "warning" : "success"}>{team.is_active === false ? "Inaktiv" : "Aktiv"}</AdminStatusChip><AdminMetric label="Spieler" value={team.players_count ?? 0} /><AdminMetric label="Trainer" value={team.coaches_count ?? 0} /></div>{showContributionSummary ? <div className="mt-3 border-t border-white/10 pt-3"><ContributionSummary summary={team.contributionSummary} /></div> : null}</AdminListMobileCard>;
}

export default function AdminTeamsList({ teams = [], showContributionSummary = false }) {
  const { scopedTeams, hasTeamManagementScope } = useTeamScope(teams);
  if (!scopedTeams.length) return <TeamEmptyState hasTeamManagementScope={hasTeamManagementScope} />;
  const columns = [{ key: "name", label: "Mannschaft" }, { key: "area", label: "Bereich" }, { key: "season", label: "Saison" }, { key: "status", label: "Status" }, { key: "people", label: "Besetzung" }, { key: "contribution", label: "Beiträge" }, { key: "details", label: "" }];
  return <AdminModuleList desktopClassName="hidden overflow-hidden xl:block" mobile={<AdminModuleCards className="xl:hidden">{scopedTeams.map((team) => <TeamMobileCard key={`${team.id}-mobile`} team={team} showContributionSummary={showContributionSummary} />)}</AdminModuleCards>}><AdminListHeader columns={columns} template={TEMPLATE} />{scopedTeams.map((team) => <AdminListRow key={team.id} href={`/admin/teams/${team.id}`} label={`Details zu ${team.name_de}`} template={TEMPLATE}><span className="truncate font-black text-white">{team.name_de}</span><span className="truncate text-white/65">{team.age_group || "Mannschaft"}</span><span className="truncate text-white/65">{team.public_season_name || "–"}</span><AdminStatusChip variant={team.is_active === false ? "warning" : "success"}>{team.is_active === false ? "Inaktiv" : "Aktiv"}</AdminStatusChip><span className="text-xs text-white/65">{team.players_count ?? 0} Sp. · {team.coaches_count ?? 0} Tr.</span>{showContributionSummary ? <ContributionSummary summary={team.contributionSummary} /> : <span className="text-white/45">Keine Beitragsanzeige</span>}<AdminListChevron label={`Details zu ${team.name_de}`} /></AdminListRow>)}</AdminModuleList>;
}
