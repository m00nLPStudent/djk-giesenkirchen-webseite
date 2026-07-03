import SponsorActions from "./SponsorActions";
import SponsorBanner from "./SponsorBanner";

export default function SponsorCard({ sponsor }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-red-500/50 hover:bg-white/10">
      <SponsorBanner sponsor={sponsor} />

      <div className="p-6">
        <h3 className="text-2xl font-black">{sponsor.name}</h3>
        {sponsor.description_de && <p className="mt-3 text-sm leading-6 text-white/55">{sponsor.description_de}</p>}
        <SponsorActions sponsor={sponsor} />
      </div>
    </article>
  );
}
