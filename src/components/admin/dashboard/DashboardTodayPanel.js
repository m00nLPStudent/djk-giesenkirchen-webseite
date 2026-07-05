import { CalendarDays } from "lucide-react";
import { formatDate } from "./dashboard.helpers";

export default function DashboardTodayPanel({
  now,
  todayCount,
  upcomingCount,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/20 text-red-400">
          <CalendarDays size={20} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
            Heute
          </p>
          <p className="text-sm font-bold text-white">{formatDate(now)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-2xl font-black text-white">{todayCount}</p>
          <p className="text-xs text-white/50">Termine heute</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-2xl font-black text-white">{upcomingCount}</p>
          <p className="text-xs text-white/50">Naechste Termine</p>
        </div>
      </div>
    </div>
  );
}
