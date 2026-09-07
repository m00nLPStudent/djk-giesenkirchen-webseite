import Link from "next/link";
import PublicCard from "@/components/website/layout/PublicCard";
import PublicPageHero from "@/components/website/layout/PublicPageHero";
import PublicPageShell from "@/components/website/layout/PublicPageShell";
import { DEPARTMENT_SECTION_PLACEHOLDER } from "./departmentSectionPublic.core.mjs";

function ContactCard({ contact }) {
  const available = contact.public && (contact.name || contact.email || contact.phone);

  return (
    <PublicCard className="h-full min-w-0" aria-labelledby="department-contact-title">
      <h2 id="department-contact-title" className="text-2xl font-black">Ansprechpartner</h2>
      {available ? (
        <div className="mt-5 min-w-0 space-y-3 text-white/70">
          {contact.name ? <p className="break-words font-bold text-white">{contact.name}</p> : null}
          {contact.email ? <p className="min-w-0 break-all"><Link className="rounded text-red-300 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400" href={`mailto:${contact.email}`}>{contact.email}</Link></p> : null}
          {contact.phone ? <p className="break-words"><Link className="rounded text-red-300 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400" href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>{contact.phone}</Link></p> : null}
        </div>
      ) : <p className="mt-5 leading-7 text-white/60">Für diesen Bereich ist derzeit kein Ansprechpartner hinterlegt.</p>}
    </PublicCard>
  );
}

function TrainingCard({ trainingTimes }) {
  return (
    <PublicCard className="h-full min-w-0" aria-labelledby="department-training-title">
      <h2 id="department-training-title" className="text-2xl font-black">Trainingszeiten</h2>
      {trainingTimes.length ? (
        <ul className="mt-5 min-w-0 divide-y divide-white/10">
          {trainingTimes.map((item, index) => (
            <li key={`${item.weekdayNumber}-${item.startTime}-${index}`} className="min-w-0 py-4 first:pt-0 last:pb-0">
              <p className="break-words font-black text-white">{item.weekday} · {item.startTime}–{item.endTime} Uhr</p>
              {item.location ? <p className="mt-2 break-words text-white/70">{item.location}</p> : null}
              {item.address || item.city ? <p className="mt-1 break-words text-sm text-white/55">{[item.address, item.city].filter(Boolean).join(", ")}</p> : null}
              {item.note ? <p className="mt-2 break-words text-sm leading-6 text-white/60">{item.note}</p> : null}
            </li>
          ))}
        </ul>
      ) : <p className="mt-5 leading-7 text-white/60">Aktuell sind keine Trainingszeiten veröffentlicht.</p>}
    </PublicCard>
  );
}

export default function PublicDepartmentSectionPage({ data, eyebrow = "Abteilung", placeholder = DEPARTMENT_SECTION_PLACEHOLDER }) {
  const imageUrl = data.section.imageUrl || placeholder;

  return (
    <PublicPageShell>
      <PublicPageHero eyebrow={eyebrow} title={data.section.title} />
      <div data-section-layout="contact-training" className="mt-10 grid items-stretch gap-6 md:grid-cols-2">
        <ContactCard contact={data.contact} />
        <TrainingCard trainingTimes={data.trainingTimes} />
      </div>
      <div data-section-layout="image" className="relative mt-8 aspect-[16/8] min-h-56 min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#18181f] shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
        {/* Public media URLs are validated server-side and are not bound to one configured image host. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={`Gruppenbild ${data.section.title}`} className={`h-full w-full ${data.section.imageUrl ? "object-cover" : "object-contain p-12 opacity-80"}`} />
      </div>
      {data.section.description ? (
        <PublicCard data-section-layout="description" className="mt-8 min-w-0" aria-labelledby="department-description-title">
          <h2 id="department-description-title" className="text-2xl font-black">Über uns</h2>
          <p className="mt-5 whitespace-pre-line break-words leading-8 text-white/70">{data.section.description}</p>
        </PublicCard>
      ) : null}
    </PublicPageShell>
  );
}
