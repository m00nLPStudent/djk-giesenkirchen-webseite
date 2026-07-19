"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminRemoveButton({
  label = "Eintrag",
  name = "",
  action,
  affected = [],
  preserved = [],
  hint = "",
  inlineError = false,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function run() {
    if (!action || busy) return;
    setErrorMessage("");
    setSuccessMessage("");
    setBusy(true);
    const result = await action();
    const { error } = result || {};
    setBusy(false);

    if (error) {
      if (inlineError) {
        setErrorMessage(error?.message || "Loeschen fehlgeschlagen.");
      } else {
        alert("Fehler: " + error.message);
      }
      return;
    }

    if (result?.message) {
      setSuccessMessage(result.message);
    }

    router.refresh();

    if (!result?.message) {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy}
        className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
      >
        {busy ? "Läuft..." : "Löschen"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#17171d] p-6 shadow-2xl shadow-black/60">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-400">Aktion bestätigen</p>
            <h2 className="mt-3 text-3xl font-black text-white">{label} entfernen?</h2>
            <p className="mt-5 text-base leading-7 text-white/65">
              {name ? `${name} wird aus dem Adminbereich entfernt.` : "Dieser Eintrag wird entfernt."}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-100">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">Wird entfernt</p>
                <ul className="mt-3 space-y-2 text-sm leading-6">
                  {affected.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-100">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">Bleibt erhalten</p>
                <ul className="mt-3 space-y-2 text-sm leading-6">
                  {preserved.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </div>

            {hint ? (
              <div className="mt-4 rounded-2xl border border-blue-500/30 bg-blue-500/15 p-4 text-sm leading-6 text-blue-100">
                {hint}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/15 p-4 text-sm leading-6 text-red-100">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-sm leading-6 text-emerald-100">
                {successMessage}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white/70">
                {successMessage ? "Schliessen" : "Abbrechen"}
              </button>
              {!successMessage ? (
                <button type="button" onClick={run} disabled={busy} className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
                  {busy ? "Bitte warten..." : "Bestätigen"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
