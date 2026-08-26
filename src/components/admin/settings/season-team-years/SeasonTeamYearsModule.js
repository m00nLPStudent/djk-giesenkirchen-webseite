"use client";

import { useMemo, useState, useTransition } from "react";
import { saveTeamSeasonYearGroupsAction } from "@/app/admin/teams/actions";
import { AdminButton, AdminListHeader, AdminListMobileCard, AdminListRow, AdminModuleCards, AdminModuleHeader, AdminModuleList, AdminModulePage, AdminPanel, AdminStatusChip } from "@/components/admin/design-system";
import { buildSeasonTeamYearsView } from "./seasonTeamYears.core.mjs";

const LIST_TEMPLATE = "minmax(12rem,1.2fr) minmax(8rem,.7fr) minmax(12rem,1fr) 7rem minmax(11rem,.8fr)";

function YearBadges({ years }) {
  return years.length ? <span className="flex flex-wrap gap-1.5">{years.map((year) => <AdminStatusChip key={year}>{year}</AdminStatusChip>)}</span> : <span className="text-sm text-white/40">Keine Jahrgänge</span>;
}

function YearEditor({ row, onSaved }) {
  const [years, setYears] = useState(row.birthYears);
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const maxYear = new Date().getUTCFullYear();
  function add() {
    const year = Number(value);
    if (!Number.isInteger(year) || year < 1900 || year > maxYear) return setMessage(`Bitte ein ganzes Jahr zwischen 1900 und ${maxYear} eingeben.`);
    if (years.includes(year)) return setMessage("Dieser Jahrgang ist bereits zugeordnet.");
    setYears((current) => [...current, year].sort((a, b) => a - b)); setValue(""); setMessage("");
  }
  function save() {
    startTransition(async () => {
      const result = await saveTeamSeasonYearGroupsAction(row.team_id, row.id, years);
      if (result.error) return setMessage(result.error.message || "Jahrgänge konnten nicht gespeichert werden.");
      onSaved(row.id, result.data || years); setEditing(false); setMessage("Jahrgänge wurden gespeichert.");
    });
  }
  if (!editing) return <div className="text-right"><AdminButton type="button" onClick={() => { setYears(row.birthYears); setEditing(true); setMessage(""); }}>Jahrgänge bearbeiten</AdminButton>{message ? <p role="status" className="mt-2 text-sm text-emerald-300">{message}</p> : null}</div>;
  return <><span className="text-right text-xs font-bold text-white/40">Wird bearbeitet</span><div data-inline-year-editor className="col-span-full space-y-3 border-t border-white/10 bg-white/[0.025] px-4 py-4 sm:px-5"><div className="flex flex-wrap gap-2">{years.length ? years.map((year) => <button key={year} type="button" onClick={() => setYears((current) => current.filter((item) => item !== year))} className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white">{year} ×</button>) : <span className="text-sm text-white/40">Keine Jahrgänge</span>}</div><div className="flex flex-wrap items-end gap-2"><label className="space-y-1"><span className="block text-xs font-bold uppercase tracking-[.15em] text-white/45">Geburtsjahrgang</span><input aria-label="Geburtsjahrgang" type="number" min="1900" max={maxYear} value={value} onChange={(event) => setValue(event.target.value)} className="h-10 w-36 rounded-xl border border-white/10 bg-black/20 px-3 text-white"/></label><AdminButton type="button" onClick={add}>Hinzufügen</AdminButton></div>{message ? <p role="alert" className="text-sm text-red-300">{message}</p> : null}<div className="flex flex-wrap gap-2"><AdminButton type="button" onClick={() => { setYears(row.birthYears); setEditing(false); setMessage(""); }}>Abbrechen</AdminButton><AdminButton type="button" variant="primary" disabled={pending} onClick={save}>{pending ? "Speichert..." : "Speichern"}</AdminButton></div></div></>;
}

function DesktopRows({ rows, onSaved }) {
  return rows.map((row) => <div key={row.id}><AdminListRow template={LIST_TEMPLATE}><span className="truncate font-black text-white">{row.name_de || row.team_name_de || "Mannschaft"}</span><span className="truncate text-white/60">{row.age_group || "–"}</span><YearBadges years={row.birthYears}/><AdminStatusChip variant={row.is_active === false ? "warning" : "success"}>{row.is_active === false ? "Inaktiv" : "Aktiv"}</AdminStatusChip><YearEditor row={row} onSaved={onSaved}/></AdminListRow></div>);
}

function MobileRows({ rows, onSaved }) {
  return <AdminModuleCards className="lg:hidden">{rows.map((row) => <AdminListMobileCard key={row.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black text-white">{row.name_de || row.team_name_de || "Mannschaft"}</p><p className="mt-1 text-sm text-white/50">{row.age_group || "Kein Altersbereich"}</p></div><AdminStatusChip variant={row.is_active === false ? "warning" : "success"}>{row.is_active === false ? "Inaktiv" : "Aktiv"}</AdminStatusChip></div><div className="mt-3"><YearBadges years={row.birthYears}/></div><div className="mt-3"><YearEditor row={row} onSaved={onSaved}/></div></AdminListMobileCard>)}</AdminModuleCards>;
}

export default function SeasonTeamYearsModule({ initialData, unavailable = false }) {
  const [seasonId, setSeasonId] = useState("");
  const [mappings, setMappings] = useState(initialData.mappings);
  const view = useMemo(() => buildSeasonTeamYearsView({ ...initialData, mappings, requestedSeasonId: seasonId }), [initialData, mappings, seasonId]);
  function saved(teamSeasonId, years) { setMappings((current) => [...current.filter((row) => row.team_season_id !== teamSeasonId), ...years.map((birth_year, index) => ({ id: `local-${teamSeasonId}-${index}`, team_season_id: teamSeasonId, birth_year }))]); }
  const columns = [{ key: "team", label: "Mannschaft" }, { key: "area", label: "Bereich / Altersgruppe" }, { key: "years", label: "Jahrgänge" }, { key: "status", label: "Status" }, { key: "action", label: "Aktion" }];
  return <AdminModulePage><AdminModuleHeader eyebrow="Einstellungen" title="Saisons & Mannschaften" description="Geburtsjahrgänge je Mannschaft und Saison verwalten."/>{unavailable ? <AdminPanel className="border-red-500/40 bg-red-600/10 p-6 text-red-100">Saisons und Mannschaften konnten nicht geladen werden. Bitte Seite neu laden.</AdminPanel> : !initialData.seasons.length ? <AdminPanel className="p-6 text-white/60">Es ist noch keine Saison angelegt.</AdminPanel> : <><label className="block max-w-md space-y-2"><span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Saison</span><select value={view.selectedSeasonId} onChange={(event) => setSeasonId(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 text-white">{initialData.seasons.map((season) => <option key={season.id} value={season.id}>{season.name}{season.is_current ? " · aktuell" : ""}{season.is_active === false ? " · inaktiv" : ""}</option>)}</select></label>{!view.rows.length ? <AdminPanel className="p-6 text-white/60">Dieser Saison sind noch keine Mannschaften zugeordnet.</AdminPanel> : <AdminModuleList mobile={<MobileRows rows={view.rows} onSaved={saved}/>}><AdminListHeader columns={columns} template={LIST_TEMPLATE}/><DesktopRows rows={view.rows} onSaved={saved}/></AdminModuleList>}</>}</AdminModulePage>;
}
