import Link from "next/link";
import {
  formatEventDate,
  formatEventTime,
  getEventTypeLabel,
} from "@/lib/events";
import DashboardTodayPanel from "./DashboardTodayPanel";
import DashboardEmptyState from "./DashboardEmptyState";
import AdminPanel from "@/components/admin/common/AdminPanel";
import AdminSectionHeader from "@/components/admin/common/AdminSectionHeader";
import { splitEventsByToday } from "./dashboard.helpers";

function EventList({ title, events }) {
  if (!events.length) {
    return (
      <DashboardEmptyState text={`Keine ${title.toLowerCase()} vorhanden.`} />
    );
  }

  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">
        {title}
      </h3>
      <div className="mt-3 space-y-3">
        {events.map((event) => {
          const editHref = event.is_virtual
            ? event.team_id
              ? `/admin/teams/edit/${event.team_id}`
              : "/admin/teams"
            : `/admin/events/edit/${event.id}`;

          return (
            <Link
              key={event.occurrence_id || `${event.id}-${event.starts_at}`}
              href={editHref}
              className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-red-500/40"
            >
              <p className="truncate text-base font-black text-white">
                {event.title_de || "Unbenannter Termin"}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-red-400">
                {getEventTypeLabel(event.event_type)}
              </p>
              <p className="mt-2 text-sm text-white/60">
                {formatEventDate(event.starts_at)} ·{" "}
                {formatEventTime(event.starts_at, {
                  isAllDay: event.is_all_day,
                })}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardUpcomingEvents({ events = [], now }) {
  const { today, upcoming } = splitEventsByToday(events, now);

  return (
    <AdminPanel>
      <AdminSectionHeader
        eyebrow="Termine"
        title="Heutige und naechste Termine"
        description="Echte Events und virtuelle Trainings aus vorhandenen Event-Helpern."
      />

      <div className="mt-5">
        <DashboardTodayPanel
          now={now}
          todayCount={today.length}
          upcomingCount={upcoming.length}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <EventList title="Heute" events={today} />
        <EventList title="Naechste" events={upcoming.slice(0, 5)} />
      </div>
    </AdminPanel>
  );
}
