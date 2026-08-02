"use client";

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import Can from "@/components/admin/auth/Can";
import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";
import { removeCoachRecord } from "@/components/admin/delete/removeActions";
import CoachAvatar from "./CoachAvatar";
import CoachStatusBadge from "./CoachStatusBadge";

function InfoRow({ label, children }) {
  return <div className="grid gap-1 border-t border-white/10 py-4 first:border-t-0 sm:grid-cols-[10rem_1fr] sm:gap-5"><dt className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">{label}</dt><dd className="min-w-0 text-sm leading-6 text-white/75">{children || "Nicht hinterlegt"}</dd></div>;
}

export default function CoachDetailOverview({ coach, notes = "", canRemove = false }) {
  const name = coach.displayName || "Trainer";
  const assignments = coach.assignments || [];
  const teams = assignments.map((item) => [item.teamNameDe || item.teamNameEn, item.roleDe || item.roleEn].filter(Boolean).join(" · "));

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-transparent p-5 md:p-7">
        <Link href="/admin/coaches" className="inline-flex items-center gap-2 text-sm font-bold text-white/60 transition hover:text-white"><ArrowLeft size={16} aria-hidden="true" /> Zurück</Link>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4"><CoachAvatar coach={coach} sizeClassName="h-16 w-16" /><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">Trainer</p><h1 className="mt-2 truncate text-2xl font-black text-white md:text-3xl">{name}</h1><div className="mt-2"><CoachStatusBadge active={coach.isActive} /></div></div></div>
          <a href="#coach-edit-form" className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700"><Pencil size={16} aria-hidden="true" /> Bearbeiten</a>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5" aria-label="Trainerinformationen">
        <dl>
          <InfoRow label="Persönliche Daten">{name}{coach.nationality ? ` · ${coach.nationality}` : ""}</InfoRow>
          <InfoRow label="Kontakt">{[coach.email, coach.phone, coach.whatsapp].filter(Boolean).join(" · ")}</InfoRow>
          <InfoRow label="Mannschaften">{teams.length ? teams.join(", ") : coach.teamNames?.join(", ")}</InfoRow>
          <InfoRow label="Lizenzen">{coach.license}</InfoRow>
          <InfoRow label="Notizen">{notes}</InfoRow>
          <InfoRow label="Historie">Keine separate Änderungshistorie vorhanden.</InfoRow>
        </dl>
      </section>

      {canRemove ? <Can permission="coaches.delete" uiOnly><section className="rounded-[1.5rem] border border-red-500/20 bg-red-500/[0.06] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black text-white">Gefahrenbereich</h2><p className="mt-1 text-sm text-white/55">Das bestehende Löschen entfernt das Trainerprofil dauerhaft. Eine Archivfunktion ist nicht vorhanden.</p></div><AdminRemoveButton label="Trainer" name={name} action={() => removeCoachRecord(coach)} affected={["Profil", "Saison-Zuordnungen"]} preserved={["Mannschaften", "Spieler", "News"]} /></div></section></Can> : null}
    </div>
  );
}
