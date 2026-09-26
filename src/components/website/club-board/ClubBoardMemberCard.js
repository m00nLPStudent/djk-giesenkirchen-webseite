import { Mail, Phone } from "lucide-react";
import BoardResponsibilitiesList from "@/components/website/board/BoardResponsibilitiesList";
import { getPhoneHref } from "@/lib/phone";

export default function ClubBoardMemberCard({ member }) {
  const phoneHref = getPhoneHref(member.phone || "");

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="h-56 w-full shrink-0 overflow-hidden bg-black/20 md:h-72">
        <img src={member.imageUrl} alt={`Vorstandsmitglied ${member.name}`} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="break-words text-xs font-black uppercase tracking-[0.22em] text-red-400">{member.role}</p>
        <h2 className="mt-3 break-words text-2xl font-black">{member.name}</h2>
        <BoardResponsibilitiesList responsibilities={member.responsibilities} personName={member.name} roleLabel={member.role} />
        {(phoneHref || member.email) && (
          <div className="mt-auto flex gap-3 pt-6">
            {phoneHref && (
              <a
                href={phoneHref}
                aria-label={`${member.name} anrufen`}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-red-500 hover:bg-red-600 hover:text-white md:h-11 md:w-11"
              >
                <Phone size={18} />
              </a>
            )}
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                aria-label={`${member.name} eine E-Mail schreiben`}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-red-500 hover:bg-red-600 hover:text-white md:h-11 md:w-11"
              >
                <Mail size={18} />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
