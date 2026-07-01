"use client";

import { useEffect, useId, useRef, useState } from "react";
import FootballDeCard from "./FootballDeCard";
import FootballDeError from "./FootballDeError";

const FOOTBALL_DE_SCRIPT_SRC = "https://www.fussball.de/widgets.js";

function loadFootballDeScript() {
  document
    .querySelectorAll('script[src^="https://www.fussball.de/widgets.js"]')
    .forEach((script) => script.remove());

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = `${FOOTBALL_DE_SCRIPT_SRC}?t=${Date.now()}`;
  script.async = false;
  document.head.appendChild(script);
}

export default function FootballDeWidget({ widgetId, widgetType, title, description }) {
  const reactId = useId();
  const widgetRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (!widgetId) return;

    setIsEmpty(false);

    const loadTimeout = window.setTimeout(() => {
      loadFootballDeScript();
    }, 250);

    const checkTimeout = window.setTimeout(() => {
      const widget = widgetRef.current;
      if (!widget) return;

      setIsEmpty(widget.children.length === 0 && widget.innerHTML.trim() === "");
    }, 3000);

    return () => {
      window.clearTimeout(loadTimeout);
      window.clearTimeout(checkTimeout);
    };
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
      <div className="football-de-widget-frame overflow-hidden rounded-3xl border border-white/10 bg-[#101014] p-4 text-white">
        <div
          ref={widgetRef}
          key={`${widgetId}-${widgetType}-${reactId}`}
          className="fussballde_widget"
          data-id={widgetId}
          data-type={widgetType}
          style={{ width: "100%", minHeight: "260px" }}
        />

        {isEmpty && (
          <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-sm leading-6 text-yellow-100">
            Das fussball.de-Widget wurde geladen, aber nicht automatisch befüllt.
            Bitte prüfe, ob die Widget-Domain exakt zur aktuell geöffneten URL passt
            und ob der Widget-Code nach dem Speichern neu kopiert wurde.
          </div>
        )}
      </div>
    </FootballDeCard>
  );
}
