import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import TeamImagePlaceholder from "@/components/website/team/TeamImagePlaceholder";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { getPhoneHref } from "@/lib/phone";
import { buildPublicTableTennisTeamHref } from "./tableTennisPublic.core.mjs";

const weekdayLabels = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export function formatTableTennisTime(value) {
  return value ? String(value).slice(0, 5) : null;
}

export function formatTableTennisWeekday(value) {
  if (typeof value === "number") return weekdayLabels[value] || String(value);
  const numeric = Number(value);
  return Number.isInteger(numeric) && String(value).trim() !== "" ? weekdayLabels[numeric] || String(value) : value || "Termin offen";
}

export function TableTennisTeamCard({ team }) {
  const training = team.training?.[0];
  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#18181f]/90 shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
      {team.imageUrl ? <img src={team.imageUrl} alt={team.name} className="h-52 w-full object-cover sm:h-64" /> : <TeamImagePlaceholder className="h-52 w-full sm:h-64" label={`Mannschaftsbild ${team.name}`} />}
      <div className="p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-red-400">{team.season?.name || "Aktuelle Saison"}</p>
        <h2 className="mt-3 break-words text-2xl font-black">{team.name}</h2>
        {team.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/65">{team.description}</p>}
        {training && <p className="mt-4 text-sm text-white/55">Training: {formatTableTennisWeekday(training.weekday)}{training.startTime ? `, ${formatTableTennisTime(training.startTime)} Uhr` : ""}</p>}
        <Link href={buildPublicTableTennisTeamHref(team.slug)} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-red-600 px-5 py-2 text-sm font-black text-white transition hover:bg-red-500">Mannschaft ansehen</Link>
      </div>
    </article>
  );
}

export function TableTennisTeamHero({ team }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-[2rem] border border-white/10">
      {team.imageUrl ? <img src={team.imageUrl} alt={team.name} className="h-56 w-full object-cover sm:h-72 md:h-[500px]" /> : <TeamImagePlaceholder className="h-56 w-full sm:h-72 md:h-[500px]" label={`Mannschaftsbild ${team.name}`} sizes="(max-width: 1280px) 100vw, 1280px" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 min-w-0 p-5 sm:p-7 md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">Tischtennis · {team.season?.name || "Aktuelle Saison"}</p>
        <h1 className="mt-3 break-words text-3xl font-black leading-tight sm:text-5xl md:text-7xl">{team.name}</h1>
        <p className="mt-2 text-sm text-white/75 sm:text-base">DJK/VfL Giesenkirchen 05/09 e.V.</p>
      </div>
    </section>
  );
}

export function TableTennisTrainingList({ entries = [], showTeam = false }) {
  if (!entries.length) return <p className="mt-6 text-white/55">Aktuell sind keine Trainingszeiten hinterlegt.</p>;
  return <div className="mt-6 grid gap-4 md:grid-cols-2">{entries.map((entry) => (
    <article key={`${entry.team?.id || "team"}-${entry.id}`} className="min-w-0 rounded-3xl border border-white/10 bg-black/20 p-5">
      {showTeam && <p className="text-xs font-black uppercase tracking-[0.22em] text-red-400">{entry.team.name}</p>}
      <h3 className={`${showTeam ? "mt-2" : ""} text-xl font-black`}>{formatTableTennisWeekday(entry.weekday)}</h3>
      <p className="mt-2 text-white/75">{formatTableTennisTime(entry.startTime) || "Beginn offen"}{entry.endTime ? `–${formatTableTennisTime(entry.endTime)}` : ""}{entry.startTime ? " Uhr" : ""}</p>
      {entry.trainingType && <p className="mt-2 text-sm text-white/55">{entry.trainingType}</p>}
      {(entry.locationName || entry.locationType) && <p className="mt-3 break-words font-semibold">{entry.locationName || entry.locationType}</p>}
      {(entry.locationAddress || entry.locationCity) && <p className="mt-1 break-words text-sm text-white/55">{[entry.locationAddress, entry.locationCity].filter(Boolean).join(", ")}</p>}
    </article>
  ))}</div>;
}

export function TableTennisPersonCard({ person, kind = "Person" }) {
  const phoneHref = getPhoneHref(person.phone || person.whatsapp || "");
  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <img src={person.imageUrl || COACH_PLACEHOLDER_IMAGE} alt={person.name} className="h-56 w-full object-cover md:h-72" />
      <div className="p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-400">{person.role || kind}</p>
        <h3 className="mt-3 break-words text-2xl font-black">{person.name}</h3>
        {person.license && <p className="mt-2 text-sm text-white/55">Lizenz: {person.license}</p>}
        {(phoneHref || person.email) && <div className="mt-5 flex gap-3">
          {phoneHref && <a href={phoneHref} aria-label={`${person.name} anrufen`} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/70 hover:border-red-500"><Phone size={18} /></a>}
          {person.email && <a href={`mailto:${person.email}`} aria-label={`${person.name} eine E-Mail schreiben`} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/70 hover:border-red-500"><Mail size={18} /></a>}
        </div>}
      </div>
    </article>
  );
}

export function TableTennisContactCard({ contact }) {
  const phoneHref = getPhoneHref(contact?.phone || contact?.whatsapp || "");
  return <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-8">
    <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">Kontakt</p>
    <h2 className="mt-3 text-2xl font-black sm:text-3xl">Ansprechpartner</h2>
    {!contact ? <p className="mt-6 text-white/55">Für diese Mannschaft ist derzeit kein Ansprechpartner hinterlegt.</p> : <div className="mt-6 flex min-w-0 flex-col gap-4 rounded-3xl border border-white/10 bg-black/20 p-5 sm:flex-row sm:items-center">
      {contact.imageUrl && <img src={contact.imageUrl} alt={contact.name || "Ansprechpartner"} className="h-20 w-20 rounded-2xl object-cover" />}
      <div className="min-w-0 flex-1"><p className="break-words text-xl font-black">{contact.name || "Ansprechpartner Tischtennis"}</p><p className="mt-1 text-sm text-white/50">Tischtennis</p></div>
      <div className="flex gap-3">{phoneHref && <a href={phoneHref} aria-label="Ansprechpartner anrufen" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10"><Phone size={18} /></a>}{contact.email && <a href={`mailto:${contact.email}`} aria-label="E-Mail an Ansprechpartner" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10"><Mail size={18} /></a>}</div>
    </div>}
  </section>;
}
