export default function SponsorBanner({ sponsor }) {
  const image = sponsor.image_url;
  const hasWebsite = Boolean(sponsor.website_url);
  const className =
    "flex min-w-0 h-32 items-center justify-center overflow-hidden bg-white p-4 sm:h-40 sm:p-5 md:h-44 md:p-6";
  const imageContent = image ? (
    <img
      src={image}
      alt={sponsor.name}
      className="h-full w-full object-contain"
    />
  ) : (
    <span className="text-sm font-bold text-black/50">Kein Banner</span>
  );

  if (!hasWebsite) {
    return <div className={className}>{imageContent}</div>;
  }

  return (
    <a
      href={sponsor.website_url}
      target="_blank"
      rel="noreferrer"
      aria-label={`${sponsor.name} Webseite öffnen`}
      className={className}
    >
      {imageContent}
    </a>
  );
}
