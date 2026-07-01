"use client";

import { useEffect, useId, useRef, useState } from "react";
import FootballDeCard from "./FootballDeCard";
import FootballDeError from "./FootballDeError";

const FOOTBALL_DE_SCRIPT_SRC = "https://www.fussball.de/widgets.js";
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"];

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

function isLocalHost() {
  if (typeof window === "undefined") return false;

  return LOCAL_HOSTS.includes(window.location.hostname);
}

function FootballDeLocalFallback({ title }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#101014] p-6 text-white shadow-inner shadow-black/30">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.25em] text-red-200">
        Lokale Vorschau
      </div>

      <div className="mt-6 space-y-4">
        <h3 className="text-2xl font-black text-white">{title} wird live geladen</h3>
        <p className="max-w-2xl text-sm leading-7 text-white/65">
          Das offizielle fussball.de-Widget prüft die hinterlegte Domain und kann
          deshalb lokal nicht korrekt angezeigt werden. Auf der freigeschalteten
          Live-Domain wird an dieser Stelle das echte Widget angezeigt.
        </p>
      </div>
    </div>
  );
}

export default function FootballDeWidget({ widgetId, widgetType, title, description }) {
  const reactId = useId();
  const widgetRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [showLocalFallback, setShowLocalFallback] = useState(false);

  useEffect(() => {
    setShowLocalFallback(isLocalHost());
  }, []);

  useEffect(() => {
    if (!widgetId || showLocalFallback) return;

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
  }, [widgetId, widgetType, reactId, showLocalFallback]);

  if (!widgetId) {
    return (
      <FootballDeCard title={title} description={description}>
        <FootballDeError title={title} />
      </FootballDeCard>
    );
  }

  if (showLocalFallback) {
    return (
      <FootballDeCard title={title} description={description} className="football-de-widget-shell">
        <FootballDeLocalFallback title={title} />
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
