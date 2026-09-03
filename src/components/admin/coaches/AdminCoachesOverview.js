"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import Can from "@/components/admin/auth/Can";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import { matchesActiveStatus, matchesSearch } from "@/components/admin/utils/list";
import AdminCoachesList from "./AdminCoachesList";
import CoachFilters from "./components/CoachFilters";
import CoachStats from "./components/CoachStats";

export default function AdminCoachesOverview({ coaches = [], canCreate = false, createHref = "/admin/coaches/new", basePath = "/admin/coaches" }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("alle");
  const filteredCoaches = useMemo(() => coaches.filter((coach) =>
    matchesActiveStatus(coach, status) && matchesSearch([
      coach.displayName,
      coach.primaryRoleLabel,
      coach.roleLabels?.join(" "),
      coach.teamNames?.join(" "),
    ], search)
  ), [coaches, search, status]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Trainer"
        title="Trainer verwalten"
        description="Trainer- und Betreuerprofile kompakt verwalten."
        actions={canCreate ? (
          <Can permission="coaches.create" uiOnly>
            <Link href={createHref} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700">
              <Plus size={17} aria-hidden="true" /> Neuer Trainer
            </Link>
          </Can>
        ) : null}
      >
        <label className="relative block max-w-xl">
          <span className="sr-only">Trainer suchen</span>
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Trainer suchen …" className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-red-500" />
        </label>
      </AdminPageHeader>
      <CoachStats coaches={coaches} />
      <CoachFilters status={status} setStatus={setStatus} />
      <AdminCoachesList coaches={filteredCoaches} basePath={basePath} />
    </div>
  );
}
