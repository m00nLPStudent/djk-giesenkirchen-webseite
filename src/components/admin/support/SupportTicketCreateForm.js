"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSupportTicketAction } from "@/app/admin/support/actions";
import { AdminBackLink, AdminButton, AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import { SUPPORT_TICKET_CATEGORIES, SUPPORT_TICKET_LABELS } from "@/lib/support-tickets/supportTickets.core.mjs";

const FIELD = "min-h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2.5 text-white outline-none focus:border-red-400";

export default function SupportTicketCreateForm({ areas = [] }) {
  const router = useRouter();
  const [form, setForm] = useState({ category: "problem", areaKey: areas[0]?.key || "", subject: "", message: "" });
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => { event.preventDefault(); setResult(null); startTransition(async () => { const response = await createSupportTicketAction(form); setResult(response); if (response.ok) router.push(`/admin/support/${response.data.ticketId}`); }); };
  const error = (field) => result?.fieldErrors?.[field];
  return <AdminModulePage><AdminBackLink href="/admin/support">Zurück zu meinen Tickets</AdminBackLink><AdminModuleHeader eyebrow="Support" title="Neues Ticket" description="Beschreibe dein Anliegen möglichst konkret. Priorität und Bearbeitungsstatus werden durch den Support verwaltet." />
    <form onSubmit={submit} className="mx-auto grid w-full max-w-3xl gap-5 rounded-[1.75rem] border border-white/10 bg-white/[.04] p-5 md:p-7">
      <div className="grid gap-5 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Kategorie<select name="category" required value={form.category} onChange={(event) => change("category", event.target.value)} className={FIELD}>{SUPPORT_TICKET_CATEGORIES.map((category) => <option key={category} value={category}>{SUPPORT_TICKET_LABELS.category[category]}</option>)}</select>{error("category") ? <span className="text-xs text-red-300">{error("category")}</span> : null}</label><label className="grid gap-2 text-sm font-bold">Bereich<select name="areaKey" required value={form.areaKey} onChange={(event) => change("areaKey", event.target.value)} className={FIELD}><option value="">Bitte auswählen</option>{areas.map((area) => <option key={area.key} value={area.key}>{area.label}</option>)}</select>{error("areaKey") ? <span className="text-xs text-red-300">{error("areaKey")}</span> : null}</label></div>
      <label className="grid gap-2 text-sm font-bold">Betreff<input name="subject" required minLength={3} maxLength={200} value={form.subject} onChange={(event) => change("subject", event.target.value)} aria-describedby={error("subject") ? "support-subject-error" : undefined} className={FIELD} />{error("subject") ? <span id="support-subject-error" className="text-xs text-red-300">{error("subject")}</span> : null}</label>
      <label className="grid gap-2 text-sm font-bold">Nachricht<textarea name="message" required maxLength={10000} rows={9} value={form.message} onChange={(event) => change("message", event.target.value)} aria-describedby={error("message") ? "support-message-error" : undefined} className={`${FIELD} resize-y`} />{error("message") ? <span id="support-message-error" className="text-xs text-red-300">{error("message")}</span> : null}</label>
      {result && !result.ok ? <p role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{result.message}</p> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><AdminButton href="/admin/support">Abbrechen</AdminButton><AdminButton type="submit" variant="primary" disabled={pending || !areas.length}>{pending ? "Ticket wird erstellt …" : "Ticket erstellen"}</AdminButton></div>
    </form>
  </AdminModulePage>;
}
