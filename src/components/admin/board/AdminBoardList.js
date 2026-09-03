"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import Can from "@/components/admin/auth/Can";
import { AdminListChevron, AdminListHeader, AdminListMobileCard, AdminListRow, AdminMetric, AdminModuleCards, AdminModuleEmptyState, AdminModuleFilters, AdminModuleHeader, AdminModuleList, AdminModulePage, AdminModulePrimaryAction, AdminModuleSearch, AdminModuleSummary } from "@/components/admin/design-system";
import BoardMemberAvatar from "./components/BoardMemberAvatar";
import BoardMemberStatus from "./components/BoardMemberStatus";
import { filterBoardMembers, getBoardMemberName, getBoardMemberSummary } from "./boardUi.helpers";

const TEMPLATE = "4rem minmax(12rem,1.2fr) minmax(11rem,1fr) minmax(11rem,0.9fr) 7rem 3rem";

function memberHref(member, basePath) {
  if (member._canEditInScope === false) return null;
  return `${basePath}/edit/${member.id}`;
}

function BoardRow({ member, href, organizationLabel }) {
  const name = getBoardMemberName(member);
  return <AdminListRow href={href} label={href ? `${name} öffnen` : undefined} template={TEMPLATE}><BoardMemberAvatar member={member} /><span className="truncate font-black text-white">{name}</span><span className="truncate text-white/65">{member.role_de || "–"}</span><span className="truncate text-white/55">{organizationLabel}</span><BoardMemberStatus member={member} />{href ? <AdminListChevron label={`${name} öffnen`} /> : <span />}</AdminListRow>;
}

function BoardMobileCard({ member, href, organizationLabel }) {
  const name = getBoardMemberName(member);
  return <AdminListMobileCard href={href} label={href ? `${name} öffnen` : undefined}><div className="flex items-start gap-4"><BoardMemberAvatar member={member} sizeClassName="h-16 w-16" /><div className="min-w-0 flex-1"><h2 className="break-words text-lg font-black text-white">{name}</h2><p className="mt-1 truncate text-sm text-white/60">{member.role_de || "Keine Funktion"}</p><p className="mt-1 text-xs text-white/40">{organizationLabel}</p><div className="mt-3"><BoardMemberStatus member={member} /></div></div>{href ? <AdminListChevron label={`${name} öffnen`} /> : null}</div></AdminListMobileCard>;
}

export default function AdminBoardList({ members = [], canCreate = false, basePath = "/admin/department/board", organizationLabel = "Organisationsbereich", title = "Vorstand & Abteilungen", eyebrow = "Abteilung" }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const visibleMembers = useMemo(() => filterBoardMembers(members, { search, status }), [members, search, status]);
  const summary = getBoardMemberSummary(members);
  const createHref = `${basePath}/new`;
  const labelFor = (member) => member._organizationLabel || organizationLabel;
  const cards = <AdminModuleCards className="xl:hidden">{visibleMembers.map((member) => { const href = memberHref(member, basePath); return <Can key={`${member.id}-mobile`} permission="board.view" uiOnly fallback={<BoardMobileCard member={member} href={null} organizationLabel={labelFor(member)} />}><BoardMobileCard member={member} href={href} organizationLabel={labelFor(member)} /></Can>; })}</AdminModuleCards>;

  return <AdminModulePage><AdminModuleHeader eyebrow={eyebrow} title={title} description="Vorstandsmitglieder und ihre organisatorische Zuordnung verwalten." actions={canCreate ? <Can permission="board.create" uiOnly><AdminModulePrimaryAction href={createHref}>+ Neuer Eintrag</AdminModulePrimaryAction></Can> : null}><AdminModuleSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Vorstand durchsuchen …" label="Vorstand durchsuchen" /></AdminModuleHeader><AdminModuleSummary><AdminMetric label="Gesamt" value={summary.total} /><AdminMetric label="Aktiv" value={summary.active} /><AdminMetric label="Inaktiv" value={summary.inactive} /></AdminModuleSummary><AdminModuleFilters title="Vorstand filtern" panelId="board-filter-panel"><label className="grid max-w-sm gap-2 text-sm font-bold text-white/65">Aktivstatus<select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#17171d] px-3 text-white"><option value="all">Alle</option><option value="active">Aktiv</option><option value="inactive">Inaktiv</option></select></label></AdminModuleFilters>{visibleMembers.length === 0 ? <AdminModuleEmptyState icon={Users} title={members.length ? "Keine Vorstandsmitglieder gefunden" : "Noch keine Vorstandsmitglieder angelegt"} description={members.length ? "Passe Suche oder Aktivstatus an." : "Erstelle den ersten Eintrag über die Primäraktion."} /> : <AdminModuleList desktopClassName="hidden overflow-hidden xl:block" mobile={cards}><AdminListHeader template={TEMPLATE} columns={[{ key: "image", label: "Profilbild" }, { key: "name", label: "Name" }, { key: "role", label: "Funktion" }, { key: "organization", label: "Bereich" }, { key: "status", label: "Status" }, { key: "detail", label: "Übersicht" }]} />{visibleMembers.map((member) => { const href = memberHref(member, basePath); return <Can key={member.id} permission="board.view" uiOnly fallback={<BoardRow member={member} href={null} organizationLabel={labelFor(member)} />}><BoardRow member={member} href={href} organizationLabel={labelFor(member)} /></Can>; })}</AdminModuleList>}</AdminModulePage>;
}
