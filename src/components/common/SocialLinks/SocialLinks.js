import { FaLinkedinIn } from "react-icons/fa";
import { SiFacebook, SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";

const socialConfig = {
  facebook: { label: "Facebook", Icon: SiFacebook },
  instagram: { label: "Instagram", Icon: SiInstagram },
  youtube: { label: "YouTube", Icon: SiYoutube },
  tiktok: { label: "TikTok", Icon: SiTiktok },
  linkedin: { label: "LinkedIn", Icon: FaLinkedinIn },
  x: { label: "X", Icon: SiX },
};

export default function SocialLinks({ links = {}, name = "Profil", className = "", compact = false }) {
  const entries = Object.entries(links).filter(([, href]) => Boolean(href));
  if (!entries.length) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {entries.map(([key, href]) => {
        const config = socialConfig[key];
        if (!config) return null;
        const Icon = config.Icon;

        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} auf ${config.label}`}
            title={config.label}
            className={`${compact ? "h-8 w-8" : "h-10 w-10"} group flex items-center justify-center rounded-lg border border-transparent bg-transparent transition hover:-translate-y-0.5 hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500`}
          >
            <Icon size={18} className="text-red-500 transition-colors group-hover:text-red-400" />
          </a>
        );
      })}
    </div>
  );
}
