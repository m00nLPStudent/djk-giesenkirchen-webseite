import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function MembershipSuccessCard() {
  return (
    <div className="rounded-[2rem] border border-green-500/25 bg-gradient-to-br from-green-500/12 to-emerald-500/8 p-8 text-center md:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-green-300">
        <CheckCircle2 size={34} />
      </div>
      <h2 className="mt-6 text-3xl font-black text-white md:text-4xl">
        Vielen Dank!
      </h2>
      <p className="mt-4 text-lg leading-8 text-white/70">
        Wir haben deine Anfrage erhalten.
      </p>
      <p className="mt-2 text-lg leading-8 text-white/70">
        Unser Verein wird sich schnellstmöglich mit dir in Verbindung setzen.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-red-600 px-7 py-4 text-sm font-black text-white transition hover:bg-red-700"
        >
          Zur Startseite
        </Link>
        <Link
          href="/kontakt"
          className="rounded-full border border-white/10 px-7 py-4 text-sm font-bold text-white/75 transition hover:border-red-500 hover:text-white"
        >
          Weitere Informationen
        </Link>
      </div>
    </div>
  );
}
