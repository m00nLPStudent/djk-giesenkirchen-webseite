import Link from "next/link";
import Can from "@/components/admin/auth/Can";
import { getEventTypeLabel } from "@/lib/events";

function getEventStatus(item) {
  const now = new Date();

  if (!item.is_published) {
    return { label: "Entwurf", className: "text-white/60 border-white/15" };
  }

  if (item.starts_at && new Date(item.starts_at) > now) {
    return {
      label: "Geplant",
      className: "text-yellow-300 border-yellow-500/40",
    };
  }

  return {
    label: "Veröffentlicht",
    className: "text-emerald-300 border-emerald-500/40",
  };
}

function formatDateTime(value) {
  if (!value) return "Kein Datum";
  return new Date(value).toLocaleString("de-DE");
}

export default function EventCard({ item }) {
  const status = getEventStatus(item);

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[180px_1fr]">
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-white/5 p-4">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title_de}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-sm text-white/40">Kein Bild</span>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
            {getEventTypeLabel(item.event_type)}
          </span>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] ${status.className}`}
          >
            {status.label}
          </span>

          <span className="text-sm text-white/40">
            {formatDateTime(item.starts_at)}
          </span>

          {item.location_name && (
            <span className="text-sm text-white/40">{item.location_name}</span>
          )}
        </div>

        <h2 className="mt-4 text-2xl font-black">{item.title_de}</h2>

        <p className="mt-3 max-w-3xl text-white/60">
          {item.teaser_de ||
            item.description_de ||
            "Keine Beschreibung hinterlegt."}
        </p>

        <div className="mt-5 flex gap-3">
          <Can permission="events.edit" uiOnly>
            <Link
              href={`/admin/events/edit/${item.id}`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
            >
              Bearbeiten
            </Link>
          </Can>

          {item.slug && (
            <Link
              href={`/termine/${item.slug}`}
              className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-bold text-red-300 transition hover:border-red-400 hover:text-red-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Öffentliche Seite
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
