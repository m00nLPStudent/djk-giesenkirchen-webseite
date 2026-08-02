"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import Can from "@/components/admin/auth/Can";
import { AdminButton, AdminListChevron, AdminListHeader, AdminListRow, AdminMetric, AdminModuleCards, AdminModuleEmptyState, AdminModuleHeader, AdminModuleList, AdminModulePage, AdminModuleSearch, AdminModuleSummary } from "@/components/admin/design-system";
import EventCard, { EventSource, EventStatus, formatEventDateTime } from "./components/EventCard";
import EventFilters from "./components/EventFilters";
import { filterAdminEventList, getAdminEventSummary } from "./eventList.helpers";

const TEMPLATE = "minmax(14rem,1.4fr) minmax(9rem,0.8fr) 8rem minmax(10rem,0.9fr) minmax(10rem,0.9fr) 3rem";
const getHref = (item) => item.admin_source === "mannschaft" ? `/admin/teams/edit/${item.team_id}` : `/admin/events/edit/${item.id}`;

function EventRow({ item, href }) {
  const teamMeta = [item.team_name_de, item.team_season_name].filter(Boolean).join(" · ") || "–";
  return <AdminListRow href={href} label={href ? `${item.title_de} öffnen` : undefined} template={TEMPLATE}><span className="truncate font-black text-white">{item.title_de}</span><EventSource event={item} /><EventStatus event={item} /><span className="text-white/65">{formatEventDateTime(item)}</span><span className="truncate text-white/55">{teamMeta}</span>{href ? <AdminListChevron label={`${item.title_de} öffnen`} /> : <span />}</AdminListRow>;
}

function PermissionLink({ item, children }) {
  const permission = item.admin_source === "mannschaft" ? "teams.edit" : "events.edit";
  return <Can permission={permission} uiOnly fallback={children(null)}>{children(getHref(item))}</Can>;
}

export default function AdminEventsList({ events = [] }) {
  const [status, setStatus] = useState("alle");
  const [source, setSource] = useState("alle");
  const [search, setSearch] = useState("");
  const filteredEvents = useMemo(() => filterAdminEventList(events, { search, status, source }), [events, search, source, status]);
  const summary = getAdminEventSummary(events);

  return <AdminModulePage><AdminModuleHeader eyebrow="Termine" title="Termine verwalten" description="Vereins- und Mannschaftstermine gemeinsam überblicken und über ihre bestehenden Fachbereiche bearbeiten." actions={<Can permission="events.create" uiOnly><AdminButton href="/admin/events/new" variant="primary">+ Neuer Termin</AdminButton></Can>}><AdminModuleSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Termine suchen …" label="Termine durchsuchen" /></AdminModuleHeader><AdminModuleSummary><AdminMetric label="Veröffentlicht" value={summary.published} /><AdminMetric label="Geplant" value={summary.planned} /><AdminMetric label="Entwurf" value={summary.drafts} /><AdminMetric label="Training morgen" value={summary.trainingTomorrow} /></AdminModuleSummary><EventFilters status={status} setStatus={setStatus} source={source} setSource={setSource} />{filteredEvents.length === 0 ? <AdminModuleEmptyState icon={CalendarDays} title="Keine Termine gefunden" description="Passe Suche oder Filter an. Neue Vereinstermine kannst du direkt über den Primärbutton anlegen." /> : <AdminModuleList desktopClassName="hidden overflow-hidden xl:block" mobile={<AdminModuleCards className="xl:hidden">{filteredEvents.map((item) => <PermissionLink key={`${item.occurrence_id || item.id}-mobile`} item={item}>{(href) => <EventCard item={item} href={href} />}</PermissionLink>)}</AdminModuleCards>}><AdminListHeader template={TEMPLATE} columns={[{ key: "title", label: "Titel" }, { key: "source", label: "Quelle" }, { key: "status", label: "Status" }, { key: "date", label: "Datum & Uhrzeit" }, { key: "team", label: "Mannschaft · Saison" }, { key: "details", label: "Übersicht" }]} />{filteredEvents.map((item) => <PermissionLink key={item.occurrence_id || item.id} item={item}>{(href) => <EventRow item={item} href={href} />}</PermissionLink>)}</AdminModuleList>}</AdminModulePage>;
}
