import { supabase } from "@/lib/supabase";
import {
  TeamHero,
  TeamIntroCard,
  TeamDetailTabs,
} from "@/components/website/team";

const tournamentItems = [
  "Spielpläne",
  "Live-Ergebnisse",
  "Tabellen",
  "Gruppenübersichten",
  "Spielorte",
  "Mannschaftsübersichten",
  "Turnierinformationen",
  "Downloads",
  "Teilnehmerlisten",
];

const eventItems = [
  "Veranstaltungsübersicht",
  "Online-Anmeldung",
  "Abmeldung",
  "Teilnehmerlisten",
  "Programmübersichten",
  "Informationen für Gäste",
  "Erinnerungen",
  "Dokumente und Downloads",
];

function mergeTeamSeason(team, teamSeason, season) {
  if (!teamSeason) {
    return {
      ...team,
      season: season?.name || team?.season,
      selected_season_id: season?.id || null,
    };
  }

  return {
    ...team,
    ...teamSeason,
    id: team.id,
    team_season_id: teamSeason.id,
    base_slug: team.slug,
    season: season?.name || team.season,
    selected_season_id: season?.id || null,
  };
}

function mapSeasonPlayers(assignments = []) {
  return assignments
    .map((assignment) => ({
      ...assignment.players,
      shirt_number: assignment.shirt_number ?? assignment.players?.shirt_number,
      position_de: assignment.position_de || assignment.players?.position_de,
      position_en: assignment.position_en || assignment.players?.position_en,
      is_captain: assignment.is_captain ?? assignment.players?.is_captain,
      is_active: assignment.is_active ?? assignment.players?.is_active,
      sort_order: assignment.sort_order ?? assignment.players?.sort_order,
    }))
    .filter((player) => player?.id && player.is_active !== false);
}

function mapSeasonCoaches(assignments = []) {
  return assignments
    .map((assignment) => ({
      ...assignment.coaches,
      role_de: assignment.role_de || assignment.coaches?.role_de,
      role_en: assignment.role_en || assignment.coaches?.role_en,
      is_active: assignment.is_active ?? assignment.coaches?.is_active,
      sort_order: assignment.sort_order ?? assignment.coaches?.sort_order,
    }))
    .filter((coach) => coach?.id && coach.is_active !== false);
}

export default async function TeamPage({ params }) {
  const { slug } = await params;

  if (slug === "turniere-events") {
    return (
      <main className="min-h-screen bg-[#101014] px-6 pt-40 pb-24 text-white md:pt-52">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 shadow-[0_30px_80px_-40px_rgba(196,0,26,0.65)] md:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Fußballabteilung
            </p>
            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
              Turniere &amp; Events
            </h1>
            <p className="mt-6 max-w-4xl text-lg leading-8 text-white/70">
              Wir arbeiten derzeit an einem umfangreichen Bereich für Turniere
              und Veranstaltungen rund um die DJK/VfL Giesenkirchen 05/09 e.V.
            </p>
            <p className="mt-4 max-w-4xl text-lg leading-8 text-white/70">
              Hier entstehen zukünftig zahlreiche Funktionen, die die
              Organisation und Teilnahme für Spieler, Eltern und Besucher
              deutlich vereinfachen.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <h2 className="text-3xl font-black md:text-4xl">
                Vereinsturniere
              </h2>
              <p className="mt-4 text-white/65">
                In Zukunft werden hier alle vereinsinternen Turniere
                übersichtlich dargestellt.
              </p>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-red-400">
                Geplant sind unter anderem:
              </p>
              <ul className="mt-5 space-y-2 text-white/80">
                {tournamentItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <h2 className="text-3xl font-black md:text-4xl">
                Vereinsveranstaltungen
              </h2>
              <p className="mt-4 text-white/65">
                Auch unsere Vereinsveranstaltungen werden künftig vollständig
                digital verwaltet.
              </p>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-red-400">
                Geplant sind unter anderem:
              </p>
              <ul className="mt-5 space-y-2 text-white/80">
                {eventItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-10 rounded-3xl border border-red-500/35 bg-red-500/10 p-6 md:p-8">
            <h3 className="text-2xl font-black md:text-3xl">Hinweis</h3>
            <p className="mt-4 text-white/80">
              Dieser Bereich befindet sich aktuell noch in Entwicklung und wird
              Schritt für Schritt erweitert.
            </p>
            <p className="mt-3 text-white/80">Vielen Dank für eure Geduld.</p>
          </div>
        </section>
      </main>
    );
  }

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const seasonList = seasons || [];
  const selectedSeason =
    seasonList.find((season) => season.is_current) || seasonList[0] || null;

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .single();

  const { data: teamSeason } =
    selectedSeason?.id && team?.id
      ? await supabase
          .from("team_seasons")
          .select("*")
          .eq("team_id", team.id)
          .eq("season_id", selectedSeason.id)
          .maybeSingle()
      : { data: null };

  const displayTeam = mergeTeamSeason(team, teamSeason, selectedSeason);

  let coaches = [];
  let players = [];

  if (teamSeason?.id) {
    const { data: coachAssignments } = await supabase
      .from("coach_team_seasons")
      .select("*, coaches(*)")
      .eq("team_season_id", teamSeason.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const { data: playerAssignments } = await supabase
      .from("player_team_seasons")
      .select("*, players(*)")
      .eq("team_season_id", teamSeason.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    coaches = mapSeasonCoaches(coachAssignments || []);
    players = mapSeasonPlayers(playerAssignments || []);
  }

  if (!coaches.length) {
    const { data: fallbackCoaches } = await supabase
      .from("coaches")
      .select("*")
      .eq("team_id", team?.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    coaches = fallbackCoaches || [];
  }

  if (!players.length) {
    const { data: fallbackPlayers } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", team?.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("last_name", { ascending: true });

    players = fallbackPlayers || [];
  }

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="px-6 pt-32 pb-24">
        <div className="mx-auto max-w-7xl space-y-8">
          <TeamHero team={displayTeam} />
          <TeamIntroCard team={displayTeam} />

          <TeamDetailTabs
            team={displayTeam}
            coaches={coaches || []}
            players={players || []}
            teamSlug={slug}
          />
        </div>
      </section>
    </main>
  );
}
