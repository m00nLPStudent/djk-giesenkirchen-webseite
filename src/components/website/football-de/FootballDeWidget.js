"use client";

import { useEffect, useId } from "react";
import FootballDeCard from "./FootballDeCard";
import FootballDeError from "./FootballDeError";

const FOOTBALL_DE_SCRIPT_SRC = "https://www.fussball.de/widgets.js";

function reloadFootballDeScript() {
  const existingScript = document.querySelector(
    `script[src="${FOOTBALL_DE_SCRIPT_SRC}"]`,
  );

  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = FOOTBALL_DE_SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
}

export default function FootballDeWidget({ widgetId, widgetType, title, description }) {
  const reactId = useId();

  useEffect(() => {
    if (!widgetId) return;

    const timeout = window.setTimeout(() => {
      reloadFootballDeScript();
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [widgetId, widgetType, reactId]);

  if (!widgetId) {
    return (
      <FootballDeCard title={title} description={description}>
        <FootballDeError title={title} />
      </FootballDeCard>
    );
  }

  return (
    <FootballDeCard title={title} description={description} className="football-de-widget-shell">
      <div className="football-de-widget-frame flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#1b1b21] p-4 text-white">
        <div
          key={`${widgetId}-${widgetType}-${reactId}`}
          className="fussballde_widget"
          data-id={widgetId}
          data-type={widgetType}
          style={{ width: "100%" }}
        />
      </div>
    </FootballDeCard>
  );
}
