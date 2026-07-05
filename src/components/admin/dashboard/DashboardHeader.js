import { formatHeaderTimestamp } from "./dashboard.helpers";
import AdminPanel from "@/components/admin/common/AdminPanel";

function getGreeting(now) {
  const hour = now.getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export default function DashboardHeader({ now }) {
  return (
    <AdminPanel>
      <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-red-400">
        Admin Dashboard
      </p>
      <h2 className="mt-3 text-2xl font-black md:text-3xl">
        {getGreeting(now)} - Uebersicht und Navigation
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60 md:text-base">
        Das Dashboard bietet eine schnelle Gesamtansicht mit Statistiken,
        offenen Aufgaben und Direktzugriffen auf die wichtigsten Admin-Bereiche.
      </p>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-white/45">
        Stand: {formatHeaderTimestamp(now)}
      </p>
    </AdminPanel>
  );
}
