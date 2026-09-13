import { loadEventTypes } from "@/components/admin/events/services/eventTypes.repository";
import { createEventDtos } from "@/components/admin/events/helpers/eventTypes.core";
import TrainingEventsOverview from "@/components/website/events/TrainingEventsOverview";
import { PublicPageShell } from "@/components/website/layout";
import { getVirtualTrainingEvents } from "@/lib/events";
import { selectTeamTrainingForDepartment } from "@/lib/events/publicTrainingScope.core.mjs";
import { resolvePublicTrainingRange } from "@/lib/events/publicTrainingRange.core.mjs";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function FootballTrainingTimesPage({ searchParams }) {
  const resolved = await searchParams;
  const { range, from, to, maxOccurrencesPerTraining } = resolvePublicTrainingRange(resolved);
  const [loaded, { data: eventTypes }] = await Promise.all([
    getVirtualTrainingEvents({ from, to, maxOccurrencesPerTraining }),
    loadEventTypes(supabase, { activeOnly: false }),
  ]);
  const events = createEventDtos(selectTeamTrainingForDepartment(loaded, "fussball"), eventTypes || []);

  return (
    <PublicPageShell>
      <TrainingEventsOverview events={events} range={range} basePath="/fussball/trainingszeiten" eyebrow="Fußball" description="Die nächsten Trainingszeiten unserer Fußballmannschaften." />
    </PublicPageShell>
  );
}
