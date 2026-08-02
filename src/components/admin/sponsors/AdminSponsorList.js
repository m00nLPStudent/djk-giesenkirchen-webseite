"use client";

import { useMemo, useState } from "react";
import { Handshake } from "lucide-react";
import Can from "@/components/admin/auth/Can";
import { AdminButton, AdminListChevron, AdminListHeader, AdminListMobileCard, AdminListRow, AdminMetric, AdminModuleCards, AdminModuleEmptyState, AdminModuleHeader, AdminModuleList, AdminModulePage, AdminModuleSearch, AdminModuleSummary } from "@/components/admin/design-system";
import SponsorFilters from "./components/SponsorFilters";
import SponsorLogo from "./components/SponsorLogo";
import SponsorStatus from "./components/SponsorStatus";
import { filterSponsors, getSponsorSummary } from "./sponsorUi.helpers";

const TEMPLATE = "5rem minmax(13rem,1.4fr) minmax(10rem,0.8fr) 7rem minmax(12rem,1fr) 3rem";
const sponsorHref = (sponsor) => `/admin/sponsors/edit/${sponsor.id}`;

function SponsorRow({ sponsor, href }) {
  return <AdminListRow href={href} label={href ? `${sponsor.name} öffnen` : undefined} template={TEMPLATE}><SponsorLogo src={sponsor.image_url} name={sponsor.name} /><span className="truncate font-black text-white">{sponsor.name}</span><span className="truncate text-white/60">{sponsor.sponsor_categories?.name_de || "–"}</span><SponsorStatus sponsor={sponsor} /><span className="truncate text-white/55">{sponsor.website_url || "Keine Website"}</span>{href ? <AdminListChevron label={`${sponsor.name} öffnen`} /> : <span />}</AdminListRow>;
}

function SponsorMobileCard({ sponsor, href }) {
  return <AdminListMobileCard href={href} label={href ? `${sponsor.name} öffnen` : undefined}><div className="flex items-start gap-4"><SponsorLogo src={sponsor.image_url} name={sponsor.name} className="h-16 w-20" /><div className="min-w-0 flex-1"><h2 className="break-words text-lg font-black text-white">{sponsor.name}</h2><p className="mt-1 truncate text-sm text-white/50">{sponsor.sponsor_categories?.name_de || "Keine Kategorie"}</p><div className="mt-3 flex flex-wrap items-center gap-2"><SponsorStatus sponsor={sponsor} /><span className="text-xs text-white/45">{sponsor.website_url ? "Website vorhanden" : "Keine Website"}</span></div></div>{href ? <AdminListChevron label={`${sponsor.name} öffnen`} /> : null}</div></AdminListMobileCard>;
}

function SponsorWithPermission({ sponsor, children }) {
  return <Can permission="sponsors.edit" uiOnly fallback={children(null)}>{children(sponsorHref(sponsor))}</Can>;
}

export default function AdminSponsorList({ sponsors = [] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const visibleSponsors = useMemo(() => filterSponsors(sponsors, { search, status }), [search, sponsors, status]);
  const summary = getSponsorSummary(sponsors);
  const emptyDescription = sponsors.length ? "Passe Suche oder Aktivstatus an." : "Lege den ersten Sponsor über den Primärbutton an.";

  return <AdminModulePage><AdminModuleHeader eyebrow="Sponsoren" title="Sponsoren verwalten" description="Sponsoren, Logos, Verlinkungen und Sichtbarkeit verwalten." actions={<Can permission="sponsors.create" uiOnly><AdminButton href="/admin/sponsors/new" variant="primary">+ Neuer Sponsor</AdminButton></Can>}><AdminModuleSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sponsoren suchen …" label="Sponsoren durchsuchen" /></AdminModuleHeader><AdminModuleSummary><AdminMetric label="Gesamt" value={summary.total} /><AdminMetric label="Aktiv" value={summary.active} /><AdminMetric label="Inaktiv" value={summary.inactive} /><AdminMetric label="Ohne Logo" value={summary.withoutLogo} /></AdminModuleSummary><SponsorFilters status={status} setStatus={setStatus} />{visibleSponsors.length === 0 ? <AdminModuleEmptyState icon={Handshake} title={sponsors.length ? "Keine Sponsoren gefunden" : "Noch keine Sponsoren angelegt"} description={emptyDescription} /> : <AdminModuleList desktopClassName="hidden overflow-hidden xl:block" mobile={<AdminModuleCards className="xl:hidden">{visibleSponsors.map((sponsor) => <SponsorWithPermission key={`${sponsor.id}-mobile`} sponsor={sponsor}>{(href) => <SponsorMobileCard sponsor={sponsor} href={href} />}</SponsorWithPermission>)}</AdminModuleCards>}><AdminListHeader template={TEMPLATE} columns={[{ key: "logo", label: "Logo" }, { key: "name", label: "Name" }, { key: "category", label: "Kategorie" }, { key: "status", label: "Status" }, { key: "website", label: "Website" }, { key: "detail", label: "Übersicht" }]} />{visibleSponsors.map((sponsor) => <SponsorWithPermission key={sponsor.id} sponsor={sponsor}>{(href) => <SponsorRow sponsor={sponsor} href={href} />}</SponsorWithPermission>)}</AdminModuleList>}</AdminModulePage>;
}
