import Image from "next/image";
import { TEAM_PLACEHOLDER_ASSET_PATH } from "@/lib/football/publicTeamImage.core.mjs";

export default function TeamImagePlaceholder({ className = "", imageClassName = "object-cover", sizes = "(max-width: 768px) 100vw, 33vw", label = "Mannschaftsbild nicht verfügbar" }) {
  return <div className={`relative overflow-hidden bg-white/5 ${className}`}><Image src={TEAM_PLACEHOLDER_ASSET_PATH} alt={label} fill sizes={sizes} className={imageClassName} /></div>;
}
