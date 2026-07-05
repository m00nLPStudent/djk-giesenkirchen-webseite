import SponsorActions from "./SponsorActions";
import SponsorBanner from "./SponsorBanner";

export default function SponsorCard({ sponsor }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-red-500/50 hover:bg-white/10">
      <SponsorBanner sponsor={sponsor} />

      <div className="min-w-0 p-5 sm:p-6">
        <h3 className="break-words text-xl font-black sm:text-2xl">
          {sponsor.name}
        </h3>
        {sponsor.description_de && (
          <p className="mt-3 break-words text-sm leading-6 text-white/55">
            {sponsor.description_de}
          </p>
        )}
        <SponsorActions sponsor={sponsor} />
      </div>
    </article>
  );
}
