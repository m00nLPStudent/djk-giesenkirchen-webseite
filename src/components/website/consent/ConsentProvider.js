"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CONSENT_STORAGE_KEY, DEFAULT_CONSENT, createConsent, parseStoredConsent } from "@/lib/consent/consent.core.mjs";

const ConsentContext = createContext(null);

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) throw new Error("useConsent must be used inside ConsentProvider");
  return context;
}

export default function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(DEFAULT_CONSENT);
  const [dialogMode, setDialogMode] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [draftExternalMedia, setDraftExternalMedia] = useState(false);
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    let stored = null;
    try { stored = parseStoredConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY)); } catch { /* Storage unavailable: remain fail closed. */ }
    const timer = window.setTimeout(() => {
      if (stored) setConsent(stored);
      else setDialogMode("required");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const save = useCallback((externalMedia) => {
    const next = createConsent(externalMedia);
    try { window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next)); } catch { /* Keep the session decision without persisting it. */ }
    setConsent(next);
    setDialogMode(null);
    setShowDetails(false);
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);

  const openSettings = useCallback(() => {
    returnFocusRef.current = document.activeElement;
    setDraftExternalMedia(consent.externalMedia);
    setShowDetails(true);
    setDialogMode("settings");
  }, [consent.externalMedia]);

  const closeSettings = useCallback(() => {
    setDialogMode(null);
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!dialogMode || !dialogRef.current) return undefined;
    const dialog = dialogRef.current;
    const selector = 'button:not([disabled]), a[href], input:not([disabled])';
    dialog.querySelector(selector)?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (dialogMode === "required") save(false);
        else closeSettings();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll(selector)];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeSettings, dialogMode, save]);

  const value = { consent, externalMediaAllowed: consent.externalMedia, allowExternalMedia: () => save(true), openSettings };
  return (
    <ConsentContext.Provider value={value}>
      {children}
      {dialogMode && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="consent-title" className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#15151b] p-5 text-white shadow-2xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">DJK/VfL Giesenkirchen</p>
            <h2 id="consent-title" className="mt-2 text-2xl font-black sm:text-3xl">Datenschutz-Einstellungen</h2>
            {!showDetails ? <p className="mt-4 text-sm leading-6 text-white/70 sm:text-base">Wir verwenden technisch notwendige Funktionen, damit unsere Website sicher und zuverlässig funktioniert. Auf einzelnen Seiten können zusätzlich Inhalte externer Anbieter eingebunden werden. Du entscheidest, ob diese geladen werden dürfen. Deine Auswahl kannst du jederzeit über „Cookie-Einstellungen“ im Footer ändern.</p> : (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-center justify-between gap-4"><h3 className="font-black">Technisch notwendig</h3><span className="text-xs font-bold uppercase tracking-wider text-white/55">Immer aktiv</span></div><p className="mt-2 text-sm leading-6 text-white/60">Speichert deine Consent-Auswahl. Notwendige Auth- und Sicherheitsfunktionen im geschützten Adminbereich bleiben ebenfalls aktiv.</p></div>
                <label className="flex cursor-pointer items-start justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4"><span><span className="font-black">Externe Inhalte</span><span className="mt-2 block text-sm leading-6 text-white/60">Erlaubt eingebettete Inhalte von FUSSBALL.DE und – sofern konfiguriert – Google Maps. Dabei wird eine Verbindung zum jeweiligen Anbieter hergestellt.</span></span><input type="checkbox" checked={draftExternalMedia} onChange={(event) => setDraftExternalMedia(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-red-600" /></label>
                <p className="px-1 text-xs leading-5 text-white/50">FUSSBALL.DE: Spielpläne und Tabellen. Google Maps: interaktive Karte nur bei vorhandener Konfiguration. Anbieterinformationen stehen in der Datenschutzerklärung.</p>
              </div>
            )}
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={() => save(true)} className="rounded-xl bg-red-600 px-4 py-3 font-bold hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400">Alle akzeptieren</button>
              <button type="button" onClick={() => save(false)} className="rounded-xl border border-white/25 px-4 py-3 font-bold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400">Nur notwendige</button>
              {showDetails ? <button type="button" onClick={() => save(draftExternalMedia)} className="rounded-xl border border-white/25 px-4 py-3 font-bold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400">Auswahl speichern</button> : <button type="button" onClick={() => { setDraftExternalMedia(false); setShowDetails(true); }} className="rounded-xl border border-white/25 px-4 py-3 font-bold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400">Einstellungen</button>}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60"><Link href="/datenschutz" onClick={closeSettings} className="underline underline-offset-4 hover:text-white">Datenschutz</Link><Link href="/impressum" onClick={closeSettings} className="underline underline-offset-4 hover:text-white">Impressum</Link></div>
          </section>
        </div>
      )}
    </ConsentContext.Provider>
  );
}
