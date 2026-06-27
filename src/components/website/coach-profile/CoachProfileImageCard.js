import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";

function FlagIcon({ country }) {
  if (!country || country.iso === "OTHER") return null;

  return (
    <img
      src={`https://flagcdn.com/w80/${country.iso.toLowerCase()}.png`}
      alt={country.de}
      className="h-7 w-11 shrink-0 rounded-md object-cover ring-1 ring-white/20"
    />
  );
}

export default function CoachProfileImageCard({ coach, fullName, country }) {
  const imageUrl = coach.image_url || COACH_PLACEHOLDER_IMAGE;
  const isPlaceholder = imageUrl === COACH_PLACEHOLDER_IMAGE;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
      <div className="relative flex min-h-[520px] flex-1 items-center justify-center bg-black/20">
        <img
          src={imageUrl}
          alt={fullName}
          className={`h-full w-full object-cover ${isPlaceholder ? "opacity-80" : ""}`}
        />

        {isPlaceholder && (
          <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-black/60 p-4 text-center text-sm font-bold text-white/70 backdrop-blur-sm">
            Noch kein Trainerfoto vorhanden
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
          Nationalität
        </p>
        <div className="mt-3 flex min-w-0 items-center gap-3 text-2xl font-black leading-tight text-white">
          {country ? (
            <>
              <FlagIcon country={country} />
              <span className="min-w-0 break-words">{country.de}</span>
            </>
          ) : (
            coach.nationality || "-"
          )}
        </div>
      </div>
    </div>
  );
}
