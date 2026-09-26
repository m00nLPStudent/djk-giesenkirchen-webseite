import Link from "next/link";

export default function TeamOverviewBackLink({ href }) {
  return (
    <Link
      href={href}
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white/80 transition hover:border-red-500 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
    >
      <span aria-hidden="true">←</span>
      <span>Zurück zur Mannschaftsübersicht</span>
    </Link>
  );
}
