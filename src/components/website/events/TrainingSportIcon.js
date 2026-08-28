import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { resolveTrainingSport } from "@/lib/events/trainingSport.mjs";

const SPORT_ICON_ASSETS = {
  football: "/images/sports-icons/football.png",
  "table-tennis": "/images/sports-icons/table-tennis.png",
  gymnastics: "/images/sports-icons/gymnastics.png",
  "inclusive-sports": "/images/sports-icons/adaptive-sports.png",
};

export default function TrainingSportIcon({ event }) {
  const assetPath = SPORT_ICON_ASSETS[resolveTrainingSport(event)];

  if (!assetPath) {
    return <CalendarDays aria-hidden="true" size={32} className="h-8 w-8 text-white/75" />;
  }

  return (
    <Image
      src={assetPath}
      alt=""
      aria-hidden="true"
      width={48}
      height={48}
      sizes="48px"
      className="h-12 w-12 object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.42)]"
    />
  );
}
