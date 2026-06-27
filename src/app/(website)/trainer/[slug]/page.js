import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CoachProfileHeader,
  CoachProfileImageCard,
  CoachProfileStatsGrid,
  getCoachContact,
  getCoachFullName,
  getCountry,
  getTeam,
} from "@/components/website/coach-profile";
import { supabase } from "@/lib/supabase";

export default async function CoachProfilePage({ params }) {
  const { slug } = await params;

  const { data: coach } = await supabase
    .from("coaches")
    .select("*, teams(id, name_de, slug)")
    .eq("slug", slug)
    .single();

  if (!coach) {
    notFound();
  }

  const fullName = getCoachFullName(coach);
  const country = getCountry(coach.nationality);
  const team = getTeam(coach);
  const contact = getCoachContact(coach);

  const stats = [
    { label: "Funktion", value: coach.role },
    { label: "Mannschaft", value: team?.name_de || coach.team_name || "Keine Mannschaft" },
    { label: "Lizenz", value: coach.license, truncate: true },
    {
      label: "E-Mail",
      value: coach.email,
      href: coach.email ? `mailto:${coach.email}` : null,
      truncate: true,
    },
    {
      label: "Telefon",
      value: contact.phoneDisplay,
      href: contact.phoneHref,
      truncate: true,
    },
    { label: "Status", value: coach.is_active ? "Aktiv" : "Inaktiv" },
  ];

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="px-6 pt-32 pb-24">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/fussball"
            className="inline-flex rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Zurück zum Fußballbereich
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[420px_1fr] lg:items-stretch">
            <CoachProfileImageCard
              coach={coach}
              fullName={fullName}
              country={country}
            />

            <div className="flex h-full flex-col">
              <CoachProfileHeader
                coach={coach}
                fullName={fullName}
                team={team}
                contact={contact}
              />

              <div className="mt-10 flex flex-1">
                <CoachProfileStatsGrid stats={stats} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
