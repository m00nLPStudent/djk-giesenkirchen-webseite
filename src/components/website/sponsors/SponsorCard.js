import SocialLinks from "@/components/common/SocialLinks";

export default function SponsorCard({ sponsor }) {
  const image = sponsor.image_url;
  const hasWebsite = Boolean(sponsor.website_url);

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-red-500/50 hover:bg-white/10">
      {hasWebsite ? (
        <a
          href={sponsor.website_url}
          target="_blank"
          rel="noreferrer"
          aria-label={`${sponsor.name} Webseite öffnen`}
          className="flex h-44 items-center justify-center bg-white p-6"
        >
          {image ? (
            <img src={image} alt={sponsor.name} className="h-full w-full object-contain" />
          ) : (
            <span className="text-sm font-bold text-black/50">Kein Banner</span>
          )}
        </a>
      ) : (
        <div className="flex h-44 items-center justify-center bg-white p-6">
          {image ? (
            <img src={image} alt={sponsor.name} className="h-full w-full object-contain" />
          ) : (
            <span className="text-sm font-bold text-black/50">Kein Banner</span>
          )}
        </div>
      )}

      <div className="p-6">
        <h3 className="text-2xl font-black">{sponsor.name}</h3>
        {sponsor.description_de && <p className="mt-3 text-sm leading-6 text-white/55">{sponsor.description_de}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {hasWebsite && (
            <a
              href={sponsor.website_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:bg-red-700"
            >
              Webseite besuchen
            </a>
          )}

          <SocialLinks
            name={sponsor.name}
            links={{
              facebook: sponsor.facebook_url,
              instagram: sponsor.instagram_url,
              tiktok: sponsor.tiktok_url,
            }}
          />
        </div>
      </div>
    </article>
  );
}
