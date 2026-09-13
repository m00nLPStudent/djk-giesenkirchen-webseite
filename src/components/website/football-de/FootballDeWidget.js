"use client";

import { useEffect, useRef, useState } from "react";
import FootballDeCard from "./FootballDeCard";
import FootballDeError from "./FootballDeError";

const FOOTBALL_DE_SCRIPT_SRC = "https://www.fussball.de/widgets.js";

const widgetNodes = new Set();
let reloadTimer = null;
let activeScript = null;

function scheduleFootballDeReload() {
  window.clearTimeout(reloadTimer);
  reloadTimer = window.setTimeout(() => {
    widgetNodes.forEach((node) => node.replaceChildren());
    document
      .querySelectorAll('script[src^="https://www.fussball.de/widgets.js"]')
      .forEach((script) => script.remove());
    const script = document.createElement("script");
    script.id = "football-de-widget-script";
    script.src = FOOTBALL_DE_SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
    activeScript = script;
  }, 50);
}

export default function FootballDeWidget({ widgetId, widgetType, title, description }) {
  const widgetRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (!widgetId) return;

    const widget = widgetRef.current;
    if (!widget) return;
    widgetNodes.add(widget);
    scheduleFootballDeReload();

    const checkTimeout = window.setTimeout(() => {
      setIsEmpty(widget.children.length === 0 && widget.innerHTML.trim() === "");
    }, 4000);

    return () => {
      window.clearTimeout(checkTimeout);
      widgetNodes.delete(widget);
      widget.replaceChildren();
      if (widgetNodes.size === 0) {
        window.clearTimeout(reloadTimer);
        activeScript?.remove();
        activeScript = null;
      }
    };
  }, [widgetId, widgetType]);

  if (!widgetId) {
    return (
      <FootballDeCard title={title} description={description}>
        <FootballDeError title={title} />
      </FootballDeCard>
    );
  }

  return (
    <FootballDeCard title={title} description={description} className="football-de-widget-shell">
      <div className="football-de-widget-frame rounded-3xl border border-white/10 bg-white p-4 text-black">
        <div
          ref={widgetRef}
          key={`${widgetId}-${widgetType}`}
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
