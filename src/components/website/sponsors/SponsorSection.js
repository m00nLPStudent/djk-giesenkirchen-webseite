import SponsorCard from "./SponsorCard";
import SponsorGrid from "./SponsorGrid";

export default function SponsorSection({ category, sponsors = [] }) {
  if (!sponsors.length) return null;

  return (
    <section
      id={category.slug}
      className="min-w-0 scroll-mt-32 md:scroll-mt-40"
    >
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        {category.name_de}
      </p>
      <h2 className="mt-3 max-w-full break-words text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
        {category.name_de}
      </h2>
      <SponsorGrid>
        {sponsors.map((sponsor) => (
          <SponsorCard key={sponsor.id} sponsor={sponsor} />
        ))}
      </SponsorGrid>
    </section>
  );
}
