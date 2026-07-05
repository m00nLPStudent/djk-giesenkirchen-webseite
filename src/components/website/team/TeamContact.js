import { Phone, User } from "lucide-react";
import { FaEnvelope, FaWhatsapp } from "react-icons/fa";

function formatPhone(phone = "") {
  if (!phone) return "";

  if (phone.startsWith("49")) {
    return `+${phone.slice(0, 2)} ${phone.slice(2, 6)} ${phone.slice(6)}`;
  }

  return phone;
}

export default function TeamContact({ team, className = "" }) {
  if (!team?.contact_name && !team?.contact_email && !team?.contact_phone) {
    return (
      <section
        className={`h-full min-w-0 rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6 md:p-8 ${className}`}
      >
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
          Kontakt
        </p>
        <h2 className="mt-3 break-words text-2xl font-black sm:text-3xl">
          Ansprechpartner
        </h2>
        <p className="mt-6 text-white/55">
          Noch kein Ansprechpartner hinterlegt.
        </p>
      </section>
    );
  }

  const formattedPhone = formatPhone(team.contact_phone);

  return (
    <section
      className={`h-full min-w-0 rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6 md:p-8 ${className}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
        Kontakt
      </p>

      <h2 className="mt-3 break-words text-2xl font-black sm:text-3xl">
        Ansprechpartner
      </h2>

      <div className="mt-8 min-w-0 rounded-3xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:h-20 sm:w-20">
            {team.contact_image_url ? (
              <img
                src={team.contact_image_url}
                alt={team.contact_name || "Ansprechpartner"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/50">
                <User size={30} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="break-words text-lg font-black text-white sm:text-xl">
              {team.contact_name || "Ansprechpartner"}
            </p>
            <p className="mt-1 text-sm text-white/50">Kontakt zur Mannschaft</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {team.contact_email && (
            <a
              href={`mailto:${team.contact_email}`}
              className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <FaEnvelope className="shrink-0 text-red-400" />
              <span className="truncate">{team.contact_email}</span>
            </a>
          )}

          {team.contact_phone && (
            <a
              href={`tel:+${team.contact_phone}`}
              className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <Phone className="shrink-0 text-red-400" size={18} />
              <span className="truncate">{formattedPhone}</span>
            </a>
          )}

          {team.contact_phone && (
            <a
              href={`https://wa.me/${team.contact_phone}`}
              target="_blank"
              className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-green-400 transition hover:bg-white/10"
            >
              <FaWhatsapp className="shrink-0" />
              WhatsApp öffnen
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
