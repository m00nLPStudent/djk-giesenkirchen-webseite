import { CheckCircle2, PauseCircle } from "lucide-react";

export default function CoachStatusBadge({ active }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
        <CheckCircle2 size={14} />
        Aktiv
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-400">
      <PauseCircle size={14} />
      Inaktiv
    </span>
  );
}
