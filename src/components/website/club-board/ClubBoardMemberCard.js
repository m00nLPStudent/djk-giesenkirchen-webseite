import BoardResponsibilitiesList from "@/components/website/board/BoardResponsibilitiesList";

export default function ClubBoardMemberCard({ member }) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <img src={member.imageUrl} alt={`Vorstandsmitglied ${member.name}`} className="h-56 w-full object-cover md:h-72" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="break-words text-xs font-black uppercase tracking-[0.22em] text-red-400">{member.role}</p>
        <h2 className="mt-3 break-words text-2xl font-black">{member.name}</h2>
        <BoardResponsibilitiesList responsibilities={member.responsibilities} personName={member.name} roleLabel={member.role} className="mt-auto pt-5" />
      </div>
    </article>
  );
}
