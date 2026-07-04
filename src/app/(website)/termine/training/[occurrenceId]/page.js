import Link from "next/link";
import { notFound } from "next/navigation";
import { buildGoogleMapsSearchUrl } from "@/lib/maps";
import {
  formatEventDate,
  formatEventTime,
  getVirtualTrainingEvents,
} from "@/lib/events";

function getTrainingTypeLabel(type = "training") {
  const map = {
    training: "Training",
    spiel: "Spiel",
    torwart: "Torwarttraining",
    foerdertraining: "Foerdertraining",
    athletik: "Athletik",
    hallentraining: "Hallentraining",
    sonstiges: "Termin",
  };

  return map[type] || "Training";
}

function getOccurrenceWindow(occurrenceId) {
  const match = String(occurrenceId || "").match(/(\d{4}-\d{2}-\d{2})-\d+$/);

  if (!match) {
    const now = new Date();
    return {
      from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      to: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      maxOccurrencesPerTraining: 370,
    };
  }

  const baseDate = new Date(`${match[1]}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) {
    const now = new Date();
    return {
      from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      to: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      maxOccurrencesPerTraining: 370,
    };
  }

  return {
    from: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
    to: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000),
    maxOccurrencesPerTraining: 8,
  };
}

function getTeamName(event = {}) {
  if (event.team_name_de) return event.team_name_de;

  if (event.teaser_de) {
    const [team] = String(event.teaser_de).split("·");
    const cleaned = (team || "").trim();
    if (cleaned) return cleaned;
  }

  if (event.title_de) {
    const label = getTrainingTypeLabel(event.training_type);
    const maybeTeam = String(event.title_de).replace(`${label} `, "").trim();
    if (maybeTeam) return maybeTeam;
  }

  return "Nicht zugeordnet";
}

export default async function TrainingDetailPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const occurrenceId = resolvedParams?.occurrenceId;

  if (!occurrenceId) {
    notFound();
  }

  const searchWindow = getOccurrenceWindow(occurrenceId);
  const virtualEvents = await getVirtualTrainingEvents(searchWindow);
  const event = virtualEvents.find(
    (item) => item.occurrence_id === occurrenceId,
  );

  if (
    !event ||
    event.is_virtual !== true ||
    event.source_type !== "team_training"
  ) {
    notFound();
  }

  const teamName = getTeamName(event);
  const trainingTypeLabel = getTrainingTypeLabel(event.training_type);
  const teamHref = event.team_slug ? `/fussball/${event.team_slug}` : null;
  const location = [event.location_name, event.location_city]
    .filter(Boolean)
    .join(" · ");
  const mapsUrl = buildGoogleMapsSearchUrl({
    locationName: event.location_name,
    locationAddress: event.location_address,
    locationCity: event.location_city,
  });

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="px-6 pt-32 pb-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm uppercase tracking-[0.35em] text-red-400">
            Training
          </p>

          <h1 className="mt-4 text-5xl font-black leading-tight md:text-6xl">
            {event.title_de || "Virtuelles Training"}
          </h1>

          <div className="mt-6 grid gap-2 text-white/70">
            <p>
              <span className="font-bold text-white">Trainingsart:</span>{" "}
              {trainingTypeLabel}
            </p>
            <p>
              <span className="font-bold text-white">Mannschaft:</span>{" "}
              {teamName}
            </p>
            <p>
              <span className="font-bold text-white">Datum:</span>{" "}
              {formatEventDate(event.starts_at)}
            </p>
            <p>
              <span className="font-bold text-white">Uhrzeit:</span>{" "}
              {formatEventTime(event.starts_at, { isAllDay: event.is_all_day })}
              {event.ends_at ? ` bis ${formatEventTime(event.ends_at)}` : ""}
            </p>
          </div>

          {(location || event.location_address) && (
            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white/70">
              <div className="min-w-0 flex-1 space-y-1">
                {location && <p className="break-words">{location}</p>}
                {event.location_address && (
                  <p className="break-words text-white/55">
                    {event.location_address}
                  </p>
                )}
              </div>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Route in Google Maps öffnen"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/55 transition hover:border-red-500/50 hover:bg-red-600/15 hover:text-red-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </a>
              )}
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/75">
            Dieser Termin wurde automatisch aus den Trainingszeiten der
            Mannschaft erzeugt.
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/termine"
              className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
            >
              Zurück zur Terminübersicht
            </Link>

            {teamHref && (
              <Link
                href={teamHref}
                className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:bg-red-600/10 hover:text-white"
              >
                Zur Mannschaft
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
