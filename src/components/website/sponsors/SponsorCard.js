import { Facebook, Instagram, Music2 } from "lucide-react";

function SocialLink({ href, label, children }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-red-500 hover:bg-red-600 hover:text-white"
    >
      {children}
    </a>
  );
}

export default function SponsorCard({ sponsor }) {
  const image = sponsor.image_url;
  const content = (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-red-500/50 hover:bg-white/10">
      <div className="flex h-44 items-center justify-center bg-white p-6">
        {image ? (
          <img src={image} alt={sponsor.name} className="h-full w-full object-contain" />
        ) : (
          <span className="text-sm font-bold text-black/50">Kein Banner</span>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-black">{sponsor.name}</h3>
        {sponsor.description_de && <p className="mt-3 text-sm leading-6 text-white/55">{sponsor.description_de}</p>}
        <div className="mt-6 flex gap-3">
          <SocialLink href={sponsor.facebook_url} label={`${sponsor.name} auf Facebook`}><Facebook size={18} /></SocialLink>
          <SocialLink href={sponsor.instagram_url} label={`${sponsor.name} auf Instagram`}><Instagram size={18} /></SocialLink>
          <SocialLink href={sponsor.tiktok_url} label={`${sponsor.name} auf TikTok`}><Music2 size={18} /></SocialLink>
        </div>
      </div>
    </div>
  );

  if (!sponsor.website_url) return content;

  return (
    <a href={sponsor.website_url} target="_blank" rel="noreferrer" className="block">
      {content}
    </a>
  );
}
