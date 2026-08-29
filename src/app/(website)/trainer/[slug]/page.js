import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CoachProfileHeader,
  CoachProfileImageCard,
  getCoachContact,
  getCoachFullName,
  getCountry,
  getTeam,
} from "@/components/website/coach-profile";
import { loadPublicCoachBySlug } from "@/components/website/coach/coachPublic.repository";
import ProfileDetailsCard from "@/components/website/profile/ProfileDetailsCard";
import { supabase } from "@/lib/supabase";

export default async function CoachProfilePage({ params }) {
  const { slug } = await params;
  const coach = await loadPublicCoachBySlug(supabase, slug);

  if (!coach) {
    notFound();
  }

  const fullName = getCoachFullName(coach);
  const country = getCountry(coach.nationality);
  const team = getTeam(coach);
  const contact = getCoachContact(coach);
  const roleLabel = coach.roleLabels.join(", ") || coach.primaryRoleLabel;
  const teamName =
    coach.teamNames.length > 1
      ? coach.teamNames.join(", ")
      : team?.name_de || coach.primaryTeamName || "Keine Mannschaft";
  const teamHref =
    coach.teamNames.length === 1 && team?.slug ? `/fussball/${team.slug}` : null;

  const details = [
    { label: "Funktion", value: roleLabel || "Trainer" },
    {
      label: "Mannschaft",
      value: teamName,
      href: teamHref,
    },
    { label: "Lizenz", value: coach.license, type: "license" },
    {
      label: "E-Mail",
      value: coach.email,
      href: coach.email ? `mailto:${coach.email}` : null,
      type: "email",
    },
    {
      label: "Telefon",
      value: contact.phoneDisplay,
      href: contact.phoneHref,
      type: "phone",
    },
    { label: "Status", value: coach.isActive ? "Aktiv" : "Inaktiv" },
  ];

  return (
    <main className="min-h-screen bg-[var(--dunkel)] text-white">
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
                <ProfileDetailsCard title="Trainerdaten" items={details} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
