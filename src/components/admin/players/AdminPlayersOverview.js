"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Can from "@/components/admin/auth/Can";
import { AdminModuleHeader, AdminModulePage, AdminModulePrimaryAction, AdminModuleSearch } from "@/components/admin/design-system";
import AdminPlayersList from "./AdminPlayersList";
import PlayerStats from "./components/PlayerStats";

export default function AdminPlayersOverview({ players, initialFilters, showContributionStatus, stats, canFilterByContribution, notices = null, nationalityView = null, createHref = "/admin/players/new", basePath = "/admin/players" }) {
  const [search, setSearch] = useState("");
  return (
    <AdminModulePage>
      <AdminModuleHeader
        eyebrow="Spieler"
        title="Spieler verwalten"
        description="Spieler, Mannschaftszuordnungen und Beitragsstatus verwalten."
        actions={<Can permission="players.create" uiOnly><AdminModulePrimaryAction href={createHref}><Plus size={17} aria-hidden="true" /> Neuer Spieler</AdminModulePrimaryAction></Can>}
      >
        <AdminModuleSearch value={search} onChange={(event) => setSearch(event.target.value)} label="Spieler suchen" placeholder="Spieler suchen …" />
      </AdminModuleHeader>
      <PlayerStats {...stats} enableContributionFilter={canFilterByContribution} />
      {notices}
      {nationalityView}
      <AdminPlayersList key={JSON.stringify(initialFilters)} players={players} initialFilters={initialFilters} showContributionStatus={showContributionStatus} search={search} basePath={basePath} />
    </AdminModulePage>
  );
}
