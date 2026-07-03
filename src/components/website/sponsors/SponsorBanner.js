export default function SponsorBanner({ sponsor }) {
  const image = sponsor.image_url;
  const hasWebsite = Boolean(sponsor.website_url);
  const className = "flex h-44 items-center justify-center bg-white p-6";
  const imageContent = image ? (
    <img src={image} alt={sponsor.name} className="h-full w-full object-contain" />
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
