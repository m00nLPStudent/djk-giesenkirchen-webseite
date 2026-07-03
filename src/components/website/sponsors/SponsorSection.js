import SponsorCard from "./SponsorCard";
import SponsorGrid from "./SponsorGrid";

export default function SponsorSection({ category, sponsors = [] }) {
  if (!sponsors.length) return null;

  return (
    <section id={category.slug} className="scroll-mt-40">
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">{category.name_de}</p>
      <h2 className="mt-3 text-4xl font-black">{category.name_de}</h2>
      <SponsorGrid>
        {sponsors.map((sponsor) => (
          <SponsorCard key={sponsor.id} sponsor={sponsor} />
        ))}
      </SponsorGrid>
    </section>
  );
}
