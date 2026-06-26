import { UserRound } from "lucide-react";
import Link from "next/link";

export default function CoachEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 py-20 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
        <UserRound size={40} className="text-red-400" />
      </div>

      <h2 className="mt-8 text-3xl font-black">Keine Trainer gefunden</h2>

      <p className="mt-3 text-white/50">
        Lege einen neuen Trainer an oder ändere deinen Filter.
      </p>

      <Link
        href="/admin/coaches/new"
        className="mt-8 inline-flex items-center rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
      >
        Neuen Trainer erstellen
      </Link>
    </div>
  );
}
