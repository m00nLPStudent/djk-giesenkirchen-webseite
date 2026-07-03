import {
  SiFacebook,
  SiInstagram,
  SiTiktok,
  SiYoutube,
  SiWhatsapp,
  SiLinkedin,
  SiX,
} from "react-icons/si";

const SOCIAL_CONFIG = {
  facebook: {
    label: "Facebook",
    Icon: SiFacebook,
  },
  instagram: {
    label: "Instagram",
    Icon: SiInstagram,
  },
  tiktok: {
    label: "TikTok",
    Icon: SiTiktok,
  },
  youtube: {
    label: "YouTube",
    Icon: SiYoutube,
  },
  whatsapp: {
    label: "WhatsApp",
    Icon: SiWhatsapp,
  },
  linkedin: {
    label: "LinkedIn",
    Icon: SiLinkedin,
  },
  x: {
    label: "X",
    Icon: SiX,
  },
};

export default function SocialLinks({ links = {}, name = "Profil", className = "" }) {
  const entries = Object.entries(links).filter(([, href]) => Boolean(href));

  if (!entries.length) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {entries.map(([key, href]) => {
        const config = SOCIAL_CONFIG[key];
        if (!config) return null;

        const Icon = config.Icon;

        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${name} auf ${config.label}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-600 hover:text-white"
          >
            <Icon size={18} />
          </a>
        );
      })}
    </div>
  );
}
