import { FaEnvelope, FaWhatsapp } from "react-icons/fa";
import { resolveCoachImageUrl } from "@/lib/people/imageUrl";

export default function TeamCoachCard({ coach }) {
  const imageUrl = resolveCoachImageUrl(coach, null);
  const roleLabel = coach.teamRoleDisplayLabel || "Rolle offen";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/40">
      <div className="flex items-center gap-5">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={coach.displayName || coach.name}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-700 text-3xl font-black">
            {(coach.displayName || coach.name || "T").charAt(0)}
          </div>
        )}

        <div>
          <h3 className="text-2xl font-black">
            {coach.displayName || coach.name}
          </h3>

          <p className="text-red-400 font-semibold">
            {roleLabel}
          </p>

          {coach.license && (
            <p className="mt-2 text-sm text-white/60">{coach.license}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {coach.email && (
          <a
            href={`mailto:${coach.email}`}
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm hover:border-red-500"
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
            className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-bold hover:bg-green-700"
          >
            <FaWhatsapp />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
