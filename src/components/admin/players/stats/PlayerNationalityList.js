import Link from "next/link";

function FlagIcon({ iso, label }) {
  if (!iso || iso === "UNKNOWN" || iso === "OTHER") return null;

  const flagUrl = "https://flagcdn.com/w40/" + iso.toLowerCase() + ".png";

  return (
    <img
      src={flagUrl}
      alt={label}
      className="h-4 w-6 rounded-sm object-cover ring-1 ring-white/20"
    />
  );
}

export default function PlayerNationalityList({ nationalities = [] }) {
  if (nationalities.length === 0) return null;

  return (
    <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-400">
            Nationalitäten
          </p>
          <h2 className="mt-2 text-2xl font-black">Übersicht nach Ländern</h2>
        </div>

        <Link
          href="/admin/players"
          className="rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white/60 transition hover:border-red-500 hover:text-white"
        >
          Schließen
        </Link>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {nationalities.map((item) => {
          const href = item.iso === "UNKNOWN" ? "/admin/players" : "/admin/players?nationality=" + item.iso;

          return (
            <Link
              key={item.iso}
              href={href}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-red-500"
            >
              <span className="inline-flex items-center gap-3 font-bold">
                <FlagIcon iso={item.iso} label={item.label} />
                {item.label}
              </span>
              <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-black">
                {item.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
