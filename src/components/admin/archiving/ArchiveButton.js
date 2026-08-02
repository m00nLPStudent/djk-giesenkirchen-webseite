"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

function money(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value || 0);
}

export default function ArchiveButton({
  entity,
  name,
  action,
  previewAction = null,
  playerAssignments = null,
  coachAssignments = null,
}) {
  const dialogRef = useRef(null);
  const router = useRouter();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const isPlayer = entity === "player";
  const isCoach = entity === "coach";
  const entityLabel = isPlayer ? "Spieler" : isCoach ? "Trainer" : "Mannschaft";
  const hasOutstanding = isPlayer && Number(preview?.count || 0) > 0;

  function openDialog() {
    setError("");
    if (!previewAction) {
      dialogRef.current?.showModal();
      return;
    }
    startTransition(async () => {
      const result = await previewAction();
      if (result?.error) return setError(result.error.message);
      setPreview(result);
      dialogRef.current?.showModal();
    });
  }

  function confirmArchive() {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (result?.error) return setError(result.error.message || "Archivierung fehlgeschlagen.");
      dialogRef.current?.close();
      router.push(isPlayer ? "/admin/players" : isCoach ? "/admin/coaches" : "/admin/teams");
      router.refresh();
    });
  }

  const title = hasOutstanding
    ? "Spieler mit offenen Beitraegen archivieren"
    : `${entityLabel} archivieren`;

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={pending}
        className="rounded-full border border-red-500 px-4 py-2.5 text-sm font-bold text-red-200 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
      >
        {pending ? "Wird geprueft ..." : `${entityLabel} archivieren`}
      </button>
      {error ? <p className="basis-full text-sm font-bold text-red-300">{error}</p> : null}
      <dialog ref={dialogRef} className="m-auto w-[min(92vw,36rem)] rounded-3xl border border-red-500/35 bg-zinc-950 p-0 text-white backdrop:bg-black/75">
        <div className="p-6 md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Gefahrenbereich</p>
          <h2 className="mt-2 text-2xl font-black">{title}</h2>
          <p className="mt-2 text-sm text-white/50">{name}</p>
          <div className="mt-5 space-y-3 text-sm leading-6 text-white/75">
            {isPlayer ? (
              <>
                {hasOutstanding ? <p>Dieser Spieler besitzt noch offene Vereinsbeitraege.</p> : null}
                <p>Der Spieler wird auf inaktiv gesetzt und aus allen aktiven Mannschaften der aktuellen Saison entfernt.</p>
                <p>Historische Daten, Beitraege und Zahlungen bleiben vollstaendig erhalten.</p>
                {hasOutstanding ? <p>Der Spieler bleibt im Bereich Vereinsbeitraege sichtbar, bis die offenen Positionen erledigt sind.</p> : null}
              </>
            ) : isCoach ? (
              <>
                <p>Der Trainer wird deaktiviert und seine aktiven Mannschaftszuordnungen der aktuellen Saison werden beendet.</p>
                <p>Die Historie bleibt vollständig erhalten und der Trainer verschwindet aus öffentlichen Bereichen.</p>
                <p>Eine spätere Reaktivierung stellt keine Mannschaftszuordnung automatisch wieder her.</p>
              </>
            ) : (
              <>
                <p>Die Mannschaft wird aus dem aktiven Vereinsbetrieb entfernt.</p>
                <p>Alle aktiven Spieler- und Trainerzuordnungen der aktuellen Mannschaftssaison werden beendet.</p>
                <p>Spieler, Trainer, historische Zuordnungen, Beitraege und Zahlungen bleiben vollstaendig erhalten. Bei einer Reaktivierung startet die Mannschaft ohne alte Zuordnungen.</p>
              </>
            )}
          </div>
          {hasOutstanding ? (
            <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm">
              {preview.count} offene Position{preview.count === 1 ? "" : "en"} · {money(preview.amount)} offen
            </div>
          ) : null}
          {!isPlayer && !isCoach && (playerAssignments !== null || coachAssignments !== null) ? (
            <p className="mt-5 text-sm text-white/60">Aktiv: {playerAssignments || 0} Spielerzuordnungen, {coachAssignments || 0} Trainerzuordnungen</p>
          ) : null}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => dialogRef.current?.close()} disabled={pending} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold">Abbrechen</button>
            <button type="button" onClick={confirmArchive} disabled={pending} className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold hover:bg-red-700 disabled:opacity-50">
              {pending ? "Wird archiviert ..." : hasOutstanding ? "Spieler trotzdem archivieren" : `${entityLabel} archivieren`}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
