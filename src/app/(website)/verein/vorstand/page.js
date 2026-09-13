import { ClubBoardMemberCard, loadPublicClubBoard } from "@/components/website/club-board";
import { PublicPageHero, PublicPageShell } from "@/components/website/layout";
import { connection } from "next/server";

export const metadata = {
  title: "Vorstand",
  description: "Vorstand des Gesamtvereins DJK/VfL Giesenkirchen.",
};

export default async function ClubBoardPage() {
  await connection();
  const result = await loadPublicClubBoard();

  return (
    <PublicPageShell>
      <PublicPageHero eyebrow="Gesamtverein" title="Vorstand" description="Die gewählte Vereinsvertretung des DJK/VfL Giesenkirchen." />
      {result.error ? (
        <p className="mt-8 text-white/55">Der Vorstand konnte derzeit nicht geladen werden.</p>
      ) : result.data.length ? (
        <div className="mt-10 grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((member) => <ClubBoardMemberCard key={`${member.name}-${member.role}`} member={member} />)}
        </div>
      ) : (
        <p className="mt-8 text-white/55">Aktuell sind keine Vorstandsmitglieder veröffentlicht.</p>
      )}
    </PublicPageShell>
  );
}
