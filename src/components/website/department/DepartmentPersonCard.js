import { Mail, Phone } from "lucide-react";
import { getPhoneHref } from "@/lib/phone";

const fallbackImage =
  "https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/players/Blanko.png";

function getFullName(person = {}) {
  return (
    `${person.first_name || ""} ${person.last_name || ""}`.trim() ||
    person.name ||
    "Kontaktperson"
  );
}

export default function DepartmentPersonCard({ person, meta, imageBadge }) {
  const fullName = getFullName(person);
  const phoneHref = getPhoneHref(person.phone || person.whatsapp || "");

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="relative flex h-56 items-center justify-center bg-black/20 md:h-72">
        <img
          src={person.image_url || person.photo_url || fallbackImage}
          alt={fullName}
          className="h-full w-full object-cover"
        />
        {imageBadge && (
          <span className="absolute bottom-4 right-4 max-w-[80%] rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-xl">
            {imageBadge}
          </span>
        )}
      </div>

      <div className="p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-red-400">
          {person.role_de || person.role || "Team"}
        </p>
        <h3 className="mt-3 text-2xl font-black">{fullName}</h3>
        {meta && <p className="mt-2 text-sm font-bold text-white/45">{meta}</p>}

        <div className="mt-6 flex gap-3">
          {phoneHref && (
            <a
              href={phoneHref}
              aria-label={`${fullName} anrufen`}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-red-500 hover:bg-red-600 hover:text-white md:h-11 md:w-11"
            >
              <Phone size={18} />
            </a>
          )}
          {person.email && (
            <a
              href={`mailto:${person.email}`}
              aria-label={`${fullName} eine E-Mail schreiben`}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-red-500 hover:bg-red-600 hover:text-white md:h-11 md:w-11"
            >
              <Mail size={18} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
