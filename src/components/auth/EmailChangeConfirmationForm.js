"use client";

import { useActionState } from "react";
import { confirmEmailChangeAction } from "@/app/auth/confirm-email-change/actions";

export default function EmailChangeConfirmationForm({ token }) {
  const [state, action, pending] = useActionState(confirmEmailChangeAction, {
    status: "ready",
    message: "",
  });

  if (state.status === "completed") {
    return (
      <div className="space-y-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-4 text-emerald-100">
        <p className="font-bold">{state.message}</p>
        <p className="text-sm">Du kannst dich ab sofort mit der neuen E-Mail-Adresse anmelden.</p>
      </div>
    );
  }

  if (
    state.status === "invalid" ||
    state.status === "failed" ||
    state.status === "expired"
  ) {
    return <p className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-4 text-sm text-red-100">{state.message}</p>;
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm leading-7 text-white/65">
        Mit der Bestätigung wird diese E-Mail-Adresse als neue Login-Adresse für dein Benutzerkonto übernommen.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Bestätigung läuft..." : "E-Mail-Adresse bestätigen"}
      </button>
    </form>
  );
}
