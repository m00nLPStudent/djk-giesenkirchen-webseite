import BoardMemberCard from "./components/BoardMemberCard";

export default function AdminBoardList({ members = [] }) {
  if (!members.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/55">
        Noch keine Vorstandsmitglieder angelegt.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {members.map((member) => (
        <BoardMemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}
