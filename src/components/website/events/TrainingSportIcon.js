import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { resolveTrainingSport } from "@/lib/events/trainingSport.mjs";

export const SPORT_ICON_ASSETS = {
  football: "/images/sports-icons/football.png",
  "table-tennis": "/images/sports-icons/table-tennis.png",
  gymnastics: "/images/sports-icons/gymnastics.png",
  "inclusive-sports": "/images/sports-icons/adaptive-sports.png",
};

export function SportIcon({ sport, className = "h-10 w-10 object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.42)]", sizes = "40px" }) {
  const assetPath = SPORT_ICON_ASSETS[sport];

  if (!assetPath) {
    return <CalendarDays aria-hidden="true" size={28} className={className} />;
  }

  return (
    <Image
      src={assetPath}
      alt=""
      aria-hidden="true"
      width={40}
      height={40}
      sizes={sizes}
      className={className}
    />
  );
}

export default function TrainingSportIcon({ event }) {
  return <SportIcon sport={resolveTrainingSport(event)} />;
}
