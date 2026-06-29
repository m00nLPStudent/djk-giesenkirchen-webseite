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

function getWidgetDiagnostics(widget) {
  const scripts = document.querySelectorAll(
    'script[src^="https://www.fussball.de/widgets.js"]',
  );

  return {
    found: Boolean(widget),
    dataId: widget?.getAttribute("data-id") || "",
    dataType: widget?.getAttribute("data-type") || "",
    children: widget?.children.length ?? 0,
    htmlLength: widget?.innerHTML.trim().length ?? 0,
    iframeCount: widget?.querySelectorAll("iframe").length ?? 0,
    scriptCount: scripts.length,
    currentHost: window.location.host,
  };
}

function FootballDeDebug({ debug }) {
  if (!debug) return null;

  return (
    <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs leading-6 text-blue-50">
      <p className="mb-2 font-black uppercase tracking-[0.2em] text-blue-200">
        Widget Debug
      </p>
      <div className="grid gap-1 md:grid-cols-2">
        <span>Gefunden: {debug.found ? "Ja" : "Nein"}</span>
        <span>Host: {debug.currentHost}</span>
        <span>Data-ID: {debug.dataId || "—"}</span>
        <span>Data-Type: {debug.dataType || "—"}</span>
        <span>Kinder: {debug.children}</span>
        <span>HTML-Länge: {debug.htmlLength}</span>
        <span>iframes: {debug.iframeCount}</span>
        <span>widgets.js: {debug.scriptCount}</span>
      </div>
    </div>
  );
}

export default function FootballDeWidget({ widgetId, widgetType, title, description }) {
  const reactId = useId();
  const widgetRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    if (!widgetId) return;

    setIsEmpty(false);
    setDebug(null);

    const loadTimeout = window.setTimeout(() => {
      loadFootballDeScript();
    }, 250);

    const checkTimeout = window.setTimeout(() => {
      const widget = widgetRef.current;
      if (!widget) return;

      const diagnostics = getWidgetDiagnostics(widget);
      setDebug(diagnostics);
      setIsEmpty(diagnostics.children === 0 && diagnostics.htmlLength === 0);
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
      <div className="football-de-widget-frame rounded-3xl border border-white/10 bg-white p-4 text-black">
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

        <FootballDeDebug debug={debug} />
      </div>
    </FootballDeCard>
  );
}
