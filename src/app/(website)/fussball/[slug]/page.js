import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";
import {
  loadPublicCoachDtosByIds,
  mapCoachDtosForTeam,
} from "@/components/website/coach/coachPublic.repository";
import {
  TeamDetailTabs,
  TeamHero,
  TeamIntroCard,
} from "@/components/website/team";
import { mapTeamRosterPlayers } from "@/components/website/team/teamRoster.core.mjs";
import { supabase } from "@/lib/supabase";
import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { resolvePublicTeamImage } from "@/lib/football/publicTeamImage.core.mjs";
import { resolveTeamContactImage } from "@/lib/football/publicTeamContactImage.core.mjs";

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
  const seasonName = season?.name || null;

  if (!teamSeason) {
    return {
      ...team,
      season: seasonName,
      public_season_name: seasonName,
      selected_season_id: season?.id || null,
    };
  }

  return {
    ...team,
    ...teamSeason,
    id: team.id,
    team_season_id: teamSeason.id,
    team_image_media_asset_id: team.team_image_media_asset_id || null,
    season_team_image_media_asset_id: teamSeason.team_image_media_asset_id || null,
    contact_image_media_asset_id: team.contact_image_media_asset_id || null,
    season_contact_image_media_asset_id: teamSeason.contact_image_media_asset_id || null,
    base_slug: team.slug,
    season: seasonName,
    public_season_name: seasonName,
    selected_season_id: season?.id || null,
  };
}

export default async function TeamPage({ params }) {
  const { slug } = await params;

  if (slug === "turniere-events") {
    return (
      <main className="min-h-screen bg-[var(--dunkel)] px-6 pt-40 pb-24 text-white md:pt-52">
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

  const [seasonResult, currentSeasonResolution] = await Promise.all([
    supabase
      .from("seasons")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    loadCurrentSeasonResolution(supabase),
  ]);

  const seasonList = seasonResult.data || [];
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
  const teamMediaUrls = await loadPublicMediaUrlMap([teamSeason?.team_image_media_asset_id, team?.team_image_media_asset_id, teamSeason?.contact_image_media_asset_id, team?.contact_image_media_asset_id]);
  displayTeam.team_image_url = resolvePublicTeamImage({
    seasonMediaAssetId: teamSeason?.team_image_media_asset_id,
    seasonLegacyUrl: teamSeason?.team_image_url,
    teamMediaAssetId: team?.team_image_media_asset_id,
    teamLegacyUrl: team?.team_image_url,
  }, teamMediaUrls.data);
  displayTeam.contact_image_url = resolveTeamContactImage({
    seasonMediaAssetId: teamSeason?.contact_image_media_asset_id,
    seasonLegacyUrl: teamSeason?.contact_image_url,
    teamMediaAssetId: team?.contact_image_media_asset_id,
    teamLegacyUrl: team?.contact_image_url,
  }, teamMediaUrls.data);

  let coaches = [];
  let players = [];

  if (currentSeasonResolution.activeSeasonId && team?.id) {
    const { data: currentCoachTeamSeason } = await supabase
      .from("team_seasons")
      .select("id")
      .eq("team_id", team.id)
      .eq("season_id", currentSeasonResolution.activeSeasonId)
      .eq("is_active", true)
      .maybeSingle();

    if (currentCoachTeamSeason?.id) {
      const { data: coachAssignments } = await supabase
        .from("coach_team_seasons")
        .select("coach_id")
        .eq("team_season_id", currentCoachTeamSeason.id)
        .eq("is_active", true);

      const coachDtos = await loadPublicCoachDtosByIds(
        supabase,
        (coachAssignments || []).map((assignment) => assignment.coach_id),
        { departmentId: team.department_id },
      );
      coaches = mapCoachDtosForTeam(coachDtos, team.id);
    }
  }

  if (teamSeason?.id) {
    const { data: playerAssignments } = await supabase
      .from("player_team_seasons")
      .select("id, player_id, shirt_number, position_de, position_en, is_captain, is_active, sort_order, players(id, first_name, last_name, image_url, photo_url, is_active, year_group, strong_foot, department_id)")
      .eq("team_season_id", teamSeason.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    players = mapTeamRosterPlayers((playerAssignments || []).filter((assignment) => {
      const player = Array.isArray(assignment.players) ? assignment.players[0] : assignment.players;
      return player?.department_id && player.department_id === team.department_id;
    }));
  }

  return (
    <main className="min-h-screen bg-[var(--dunkel)] text-white">
      <section className="overflow-x-hidden px-4 pt-28 pb-20 sm:px-6 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-7xl min-w-0 space-y-8">
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
