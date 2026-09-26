"use client";

import { Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import { SportIcon } from "@/components/website/events/TrainingSportIcon";
import { filterResultsForRouteContext, resolveResultsTickerRouteContext } from "./resultsTickerRouteContext.mjs";

const RESULT_SPORT_ICON = Object.freeze({ fussball: "football", tischtennis: "table-tennis" });

function TeamLogo({ src }) {
  return src ? <img src={src} alt="" className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7" /> : <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/55 sm:h-7 sm:w-7"><Shield aria-hidden="true" size={15} /></span>;
}

function ResultItem({ result }) {
  return <article className="flex shrink-0 items-center gap-2 px-4 py-1.5 text-xs text-white sm:gap-2.5 sm:px-5 sm:text-sm" aria-label={`${result.teamName}, ${result.homeName} gegen ${result.awayName}, Endstand ${result.homeScore} zu ${result.awayScore}`}>
    <span className="flex max-w-36 shrink-0 items-center gap-1.5 sm:max-w-48">
      <SportIcon sport={RESULT_SPORT_ICON[result.departmentSlug]} sizes="20px" className="h-5 w-5 shrink-0 object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]" />
      <strong className="truncate text-[0.65rem] uppercase tracking-[0.12em] text-red-300 sm:text-xs">{result.teamName}</strong>
    </span>
    <span aria-hidden="true" className="h-4 w-px bg-white/15" />
    <TeamLogo src={result.homeLogoUrl} />
    <strong className="rounded-md bg-white/10 px-2 py-1 tabular-nums text-white">{result.homeScore} : {result.awayScore}</strong>
    <TeamLogo src={result.awayLogoUrl} />
  </article>;
}

export default function ResultsTicker({ results = [] }) {
  const pathname = usePathname();
  const context = resolveResultsTickerRouteContext(pathname);
  const visibleResults = filterResultsForRouteContext(results, context);

  if (!visibleResults.length) return null;
  const items = visibleResults.map((result) => <ResultItem key={result.id} result={result} />);
  return <section className="results-ticker" data-visible="true" aria-label="Aktuelle Vereinsergebnisse">
    <div className="results-ticker__viewport" tabIndex={0}>
      <div className="results-ticker__marquee results-ticker__marquee--active">
        <div className="results-ticker__track">{items}</div>
        <div className="results-ticker__track" aria-hidden="true">{visibleResults.map((result) => <ResultItem key={`duplicate-${result.id}`} result={result} />)}</div>
      </div>
    </div>
  </section>;
}
