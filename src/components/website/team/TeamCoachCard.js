import { FaEnvelope, FaWhatsapp } from "react-icons/fa";
import { resolveCoachImageUrl } from "@/lib/people/imageUrl";
import { getTeamCoachNameLines } from "./teamCoachCard.core.mjs";
import { getPublicCoachLicense } from "@/components/website/coach/coachPublic.core.mjs";

export default function TeamCoachCard({ coach }) {
  const imageUrl = resolveCoachImageUrl(coach, null);
  const roleLabel = coach.teamRoleDisplayLabel || "Rolle offen";
  const nameLines = getTeamCoachNameLines(coach);
  const license = getPublicCoachLicense(coach.license);

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-red-500/40">
      <div className="h-56 w-full shrink-0 overflow-hidden bg-black/20 md:h-72">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={coach.displayName || coach.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-red-700 text-5xl font-black">
            {(coach.displayName || coach.name || "T").charAt(0)}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-400">
          {roleLabel}
        </p>
        <div className="min-w-0">
          <h3
            className="mt-3 text-2xl font-black leading-7"
            aria-label={coach.displayName || coach.name}
          >
            <span className="block min-h-7 break-words">{nameLines.firstName}</span>
            <span className="block min-h-7 break-words">{nameLines.lastName}</span>
          </h3>

          {license && (
            <p className="mt-2 text-sm text-white/60">{license}</p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          {coach.email && (
            <a
              href={`mailto:${coach.email}`}
              className="flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm hover:border-red-500"
            >
              <FaEnvelope />
              E-Mail
            </a>
          )}

          {coach.whatsapp && (
            <a
              href={`https://wa.me/${coach.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-bold hover:bg-green-700"
            >
              <FaWhatsapp />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
