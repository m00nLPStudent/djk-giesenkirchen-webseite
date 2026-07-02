import { formatGermanPhoneNumberReadable, getPhoneHref } from "@/lib/phone";

const fallbackImage =
  "https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/players/Blanko.png";

function getFullName(person = {}) {
  return `${person.first_name || ""} ${person.last_name || ""}`.trim() || person.name || "Kontaktperson";
}

export default function DepartmentPersonCard({ person, meta }) {
  const fullName = getFullName(person);
  const phone = formatGermanPhoneNumberReadable(person.phone || person.whatsapp || "");
  const phoneHref = getPhoneHref(person.phone || person.whatsapp || "");

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="flex h-72 items-center justify-center bg-black/20">
        <img src={person.image_url || person.photo_url || fallbackImage} alt={fullName} className="h-full w-full object-cover" />
      </div>
      <div className="p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-red-400">{person.role_de || person.role || "Team"}</p>
        <h3 className="mt-3 text-2xl font-black">{fullName}</h3>
        {meta && <p className="mt-2 text-sm font-bold text-white/45">{meta}</p>}
        <div className="mt-5 space-y-2 text-sm text-white/65">
          {phone && phoneHref && <p><a href={phoneHref} className="hover:text-white">{phone}</a></p>}
          {person.email && <p><a href={`mailto:${person.email}`} className="hover:text-white">{person.email}</a></p>}
        </div>
      </div>
    </article>
  );
}
