import SponsorCard from "./components/SponsorCard";

export default function AdminSponsorList({ sponsors = [] }) {
  if (!sponsors.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/55">
        Noch keine Sponsoren angelegt.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sponsors.map((sponsor) => (
        <SponsorCard key={sponsor.id} sponsor={sponsor} />
      ))}
    </div>
  );
}
