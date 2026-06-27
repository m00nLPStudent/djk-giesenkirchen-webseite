import { User } from "lucide-react";
import { FaEnvelope, FaWhatsapp } from "react-icons/fa";

export default function TeamContact({ team }) {
  if (!team?.contact_name && !team?.contact_email && !team?.contact_phone) {
    return null;
  }

  const formattedPhone = team?.contact_phone
    ? `+${team.contact_phone.slice(0, 2)} ${team.contact_phone.slice(
        2,
        6,
      )} ${team.contact_phone.slice(6)}`
    : "";

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        Ansprechpartner
      </p>

      <h2 className="mt-3 text-3xl font-black">Kontakt aufnehmen</h2>

      <div className="mt-8 space-y-6">
        {team.contact_name && (
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/5">
              {team.contact_image_url ? (
                <img
                  src={team.contact_image_url}
                  alt={team.contact_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User size={28} />
                </div>
              )}
            </div>

            <div>
              <p className="font-bold">{team.contact_name}</p>
              <p className="text-white/50">Ansprechpartner</p>
            </div>
          </div>
        )}

        {team.contact_email && (
          <a
            href={`mailto:${team.contact_email}`}
            className="flex items-center gap-3"
          >
            <FaEnvelope />
            {team.contact_email}
          </a>
        )}

        {team.contact_phone && (
          <a
            href={`https://wa.me/${team.contact_phone}`}
            target="_blank"
            className="flex items-center gap-3 text-green-400"
          >
            <FaWhatsapp />
            {formattedPhone}
          </a>
        )}
      </div>
    </section>
  );
}
