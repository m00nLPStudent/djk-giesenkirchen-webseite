"use client";

import { useRef, useState } from "react";
import { AdminButton } from "./AdminModule";

export function AdminImagePreview({ src, alt, fileName = "Bild" }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const [failedSrc, setFailedSrc] = useState(null);
  const available = Boolean(src && failedSrc !== src);

  function openPreview() {
    if (!available) return;
    document.body.style.overflow = "hidden";
    dialogRef.current?.showModal();
  }

  function closePreview() {
    document.body.style.overflow = "";
    dialogRef.current?.close();
    triggerRef.current?.focus();
  }

  if (!src) return <p className="text-sm text-white/45">Kein Bild hinterlegt.</p>;
  if (!available) return <p className="text-sm text-white/45">Das hinterlegte Bild konnte nicht geladen werden.</p>;

  return (
    <>
      <button ref={triggerRef} type="button" onClick={openPreview} aria-label={`Bildvorschau für ${alt} öffnen`} className="flex min-h-11 w-full items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-left transition hover:border-red-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} onError={() => setFailedSrc(src)} className="h-20 w-28 shrink-0 rounded-xl object-cover" />
        <span className="min-w-0"><span className="block break-all text-sm font-bold text-white">{fileName}</span><span className="mt-1 block text-xs text-white/45">Für große Vorschau öffnen</span></span>
      </button>
      <dialog ref={dialogRef} aria-labelledby="admin-image-preview-title" onCancel={(event) => { event.preventDefault(); closePreview(); }} onClick={(event) => { if (event.target === dialogRef.current) closePreview(); }} className="m-auto max-h-[92vh] w-[min(94vw,72rem)] rounded-3xl border border-white/15 bg-zinc-950 p-0 text-white backdrop:bg-black/80">
        <div className="flex max-h-[92vh] flex-col p-4 md:p-6"><div className="flex items-center justify-between gap-4"><h2 id="admin-image-preview-title" className="min-w-0 break-all text-lg font-black">{fileName}</h2><AdminButton onClick={closePreview}>Schließen</AdminButton></div><div className="mt-4 min-h-0 overflow-auto rounded-2xl bg-black/30 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="mx-auto max-h-[76vh] max-w-full object-contain" />
        </div></div>
      </dialog>
    </>
  );
}
