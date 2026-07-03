import SocialLinks from "@/components/common/SocialLinks";

export default function SponsorActions({ sponsor }) {
  const hasWebsite = Boolean(sponsor.website_url);

  if (!hasWebsite && !sponsor.facebook_url && !sponsor.instagram_url && !sponsor.tiktok_url) {
    return null;
  }

  return (
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
  );
}
