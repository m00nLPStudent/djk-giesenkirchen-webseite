export default function ClubBoardMemberCard({ member }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <img src={member.imageUrl} alt={`Vorstandsmitglied ${member.name}`} className="h-56 w-full object-cover md:h-72" />
      <div className="p-5 sm:p-6">
        <p className="break-words text-xs font-black uppercase tracking-[0.22em] text-red-400">{member.role}</p>
        <h2 className="mt-3 break-words text-2xl font-black">{member.name}</h2>
      </div>
    </article>
  );
}
