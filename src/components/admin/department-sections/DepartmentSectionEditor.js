"use client";
import { useState } from "react";
import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";

const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const emptyTraining = { weekday: 1, start_time: "18:00", end_time: "19:00", location_name: "", location_address: "", location_city: "", location_note: "", effective_from: "", effective_until: "", is_active: true, sort_order: 0 };
const fieldClass = "mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-red-400/60";

function Feedback({ value }) {
  if (!value?.message) return null;
  return <p role={value.ok ? "status" : "alert"} className={`rounded-2xl border px-4 py-3 text-sm ${value.ok ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-red-400/30 bg-red-500/10 text-red-100"}`}>{value.message}</p>;
}

function Toggle({ label, checked, onChange, hint }) {
  return <label className="flex items-start justify-between gap-5 rounded-2xl border border-white/10 bg-black/15 p-4">
    <span><strong className="block text-sm">{label}</strong>{hint ? <span className="mt-1 block text-xs text-white/50">{hint}</span> : null}</span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-5 w-5 accent-red-600" />
  </label>;
}

function TrainingFields({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  return <div className="grid gap-4 md:grid-cols-2">
    <label className="text-sm font-semibold">Wochentag<select value={value.weekday} onChange={(event) => set("weekday", Number(event.target.value))} className={fieldClass}>{WEEKDAYS.map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></label>
    <label className="text-sm font-semibold">Sortierung<input type="number" min="0" max="1000000" value={value.sort_order} onChange={(event) => set("sort_order", event.target.value)} className={fieldClass}/></label>
    <label className="text-sm font-semibold">Beginn<input type="time" required value={value.start_time?.slice(0, 5) || ""} onChange={(event) => set("start_time", event.target.value)} className={fieldClass}/></label>
    <label className="text-sm font-semibold">Ende<input type="time" required value={value.end_time?.slice(0, 5) || ""} onChange={(event) => set("end_time", event.target.value)} className={fieldClass}/></label>
    <label className="text-sm font-semibold">Trainingsort / Hallenname<input value={value.location_name || ""} onChange={(event) => set("location_name", event.target.value)} className={fieldClass}/></label>
    <label className="text-sm font-semibold">Straße<input value={value.location_address || ""} onChange={(event) => set("location_address", event.target.value)} className={fieldClass}/></label>
    <label className="text-sm font-semibold">Stadt<input value={value.location_city || ""} onChange={(event) => set("location_city", event.target.value)} className={fieldClass}/></label>
    <label className="text-sm font-semibold">Zusatzhinweis<input value={value.location_note || ""} onChange={(event) => set("location_note", event.target.value)} className={fieldClass}/></label>
    <label className="text-sm font-semibold">Gültig ab<input type="date" value={value.effective_from || ""} onChange={(event) => set("effective_from", event.target.value)} className={fieldClass}/></label>
    <label className="text-sm font-semibold">Gültig bis<input type="date" value={value.effective_until || ""} onChange={(event) => set("effective_until", event.target.value)} className={fieldClass}/></label>
    <div className="md:col-span-2"><Toggle label="Trainingszeit aktiv" checked={value.is_active !== false} onChange={(checked) => set("is_active", checked)}/></div>
  </div>;
}

export default function DepartmentSectionEditor({ config, initialSection, initialTrainingTimes = [], actions }) {
  const {
    createDepartmentTrainingAction,
    deleteDepartmentTrainingAction,
    loadDepartmentSectionMediaPickerAction,
    saveDepartmentSectionAction,
    updateDepartmentTrainingAction,
    uploadDepartmentSectionMediaAction,
  } = actions;
  const [section, setSection] = useState({
    title_de: initialSection?.title_de || config.defaultTitle,
    description_de: initialSection?.description_de || "",
    contact_name: initialSection?.contact_name || "",
    contact_email: initialSection?.contact_email || "",
    contact_phone: initialSection?.contact_phone || "",
    contact_is_public: initialSection?.contact_is_public === true,
    is_active: initialSection?.is_active !== false,
    is_published: initialSection?.is_published === true,
  });
  const [selectedMedia, setSelectedMedia] = useState(initialSection?.selectedMedia || null);
  const [sectionExists, setSectionExists] = useState(Boolean(initialSection));
  const [trainings, setTrainings] = useState(initialTrainingTimes);
  const [trainingDraft, setTrainingDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [pending, setPending] = useState(false);
  const setSectionField = (key, value) => setSection((current) => ({ ...current, [key]: value }));

  async function saveSection(event) {
    event.preventDefault();
    setPending(true); setFeedback(null);
    const response = await saveDepartmentSectionAction({ ...section, image_media_asset_id: selectedMedia?.id || null });
    setPending(false);
    if (response.ok) setSectionExists(true);
    setFeedback({ ok: response.ok, message: response.ok ? `${config.label} wurde gespeichert.` : response.error || "Speichern fehlgeschlagen." });
  }

  function beginCreate() { setEditingId(null); setTrainingDraft({ ...emptyTraining }); setFeedback(null); }
  function beginEdit(item) { setEditingId(item.id); setTrainingDraft({ ...item }); setFeedback(null); }
  function cancelTraining() { setEditingId(null); setTrainingDraft(null); }

  async function saveTraining(event) {
    event.preventDefault();
    setPending(true); setFeedback(null);
    const response = editingId
      ? await updateDepartmentTrainingAction(editingId, trainingDraft)
      : await createDepartmentTrainingAction(trainingDraft);
    setPending(false);
    if (!response.ok) { setFeedback({ ok: false, message: response.error || "Speichern fehlgeschlagen." }); return; }
    setTrainings((current) => editingId
      ? current.map((item) => item.id === editingId ? response.data : item)
      : [...current, response.data]);
    cancelTraining();
    setFeedback({ ok: true, message: "Trainingszeit wurde gespeichert." });
  }

  async function toggleTraining(item) {
    setPending(true); setFeedback(null);
    const response = await updateDepartmentTrainingAction(item.id, { ...item, is_active: !item.is_active });
    setPending(false);
    if (response.ok) setTrainings((current) => current.map((entry) => entry.id === item.id ? response.data : entry));
    setFeedback({ ok: response.ok, message: response.ok ? "Status wurde aktualisiert." : response.error || "Statusänderung fehlgeschlagen." });
  }

  async function removeTraining(item) {
    if (!window.confirm("Trainingszeit wirklich löschen?")) return;
    setPending(true); setFeedback(null);
    const response = await deleteDepartmentTrainingAction(item.id);
    setPending(false);
    if (response.ok) setTrainings((current) => current.filter((entry) => entry.id !== item.id));
    setFeedback({ ok: response.ok, message: response.ok ? "Trainingszeit wurde gelöscht." : response.error || "Löschen fehlgeschlagen." });
  }

  return <div className="grid gap-6">
    <Feedback value={feedback}/>
    {!sectionExists ? <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">Noch keine Section gespeichert. Die angezeigten Standardwerte werden erst mit „Bereich speichern“ angelegt.</div> : null}
    <form onSubmit={saveSection} className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6"><h2 className="text-lg font-black">Allgemein</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold md:col-span-2">Titel<input required maxLength="200" value={section.title_de} onChange={(event) => setSectionField("title_de", event.target.value)} className={fieldClass}/></label><Toggle label="Bereich aktiv" checked={section.is_active} onChange={(checked) => setSectionField("is_active", checked)}/><Toggle label="Öffentlich veröffentlicht" checked={section.is_published} onChange={(checked) => setSectionField("is_published", checked)} hint="Speichern veröffentlicht den Bereich nicht automatisch."/></div></section>
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6"><h2 className="text-lg font-black">Medien / Gruppenbild</h2><div className="mt-5"><AdminMediaPicker value={selectedMedia} onChange={setSelectedMedia} loadAction={loadDepartmentSectionMediaPickerAction} uploadAction={uploadDepartmentSectionMediaAction} usageContext="department_section" defaultPurpose="cms" entityLabel="Gruppenbild"/></div></section>
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6"><h2 className="text-lg font-black">Beschreibung</h2><label className="mt-5 block text-sm font-semibold">Deutscher Beschreibungstext<textarea rows="9" maxLength="20000" value={section.description_de} onChange={(event) => setSectionField("description_de", event.target.value)} className={fieldClass}/><span className="mt-2 block text-right text-xs text-white/40">{section.description_de.length}/20.000</span></label></section>
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6"><h2 className="text-lg font-black">Ansprechpartner</h2><p className="mt-1 text-sm text-white/50">Kein Personen- oder Vorstandsfallback: Es erscheinen später nur diese bewusst gepflegten Angaben.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Name<input maxLength="200" value={section.contact_name} onChange={(event) => setSectionField("contact_name", event.target.value)} className={fieldClass}/></label><label className="text-sm font-semibold">E-Mail<input type="email" maxLength="320" value={section.contact_email} onChange={(event) => setSectionField("contact_email", event.target.value)} className={fieldClass}/></label><label className="text-sm font-semibold">Telefon<input maxLength="80" value={section.contact_phone} onChange={(event) => setSectionField("contact_phone", event.target.value)} className={fieldClass}/></label><Toggle label="Kontaktdaten öffentlich anzeigen" checked={section.contact_is_public} onChange={(checked) => setSectionField("contact_is_public", checked)} hint="Ist dies aus, bleiben die Daten im Dashboard bearbeitbar, aber öffentlich verborgen."/></div></section>
      <div className="flex justify-end"><button type="submit" disabled={pending} className="rounded-full bg-red-600 px-6 py-3 font-bold text-white disabled:opacity-50">{pending ? "Speichert …" : "Bereich speichern"}</button></div>
    </form>

    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-black">Trainingszeiten</h2><p className="mt-1 text-sm text-white/50">Trainingszeiten erscheinen öffentlich erst, wenn Bereich und Training aktiv sowie der Bereich veröffentlicht sind.</p></div>{!trainingDraft ? <button type="button" onClick={beginCreate} className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold">Trainingszeit hinzufügen</button> : null}</div>
      <div className="mt-5 grid gap-3">{trainings.length ? trainings.map((item) => <div key={item.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 md:grid-cols-[1fr_auto] md:items-center"><div><strong>{WEEKDAYS[item.weekday - 1]} · {item.start_time?.slice(0, 5)}–{item.end_time?.slice(0, 5)}</strong><p className="mt-1 text-sm text-white/55">{[item.location_name, item.location_address, item.location_city].filter(Boolean).join(" · ") || "Kein Trainingsort angegeben"}</p><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-bold ${item.is_active ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-white/50"}`}>{item.is_active ? "Aktiv" : "Inaktiv"}</span></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => beginEdit(item)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold">Bearbeiten</button><button type="button" disabled={pending} onClick={() => toggleTraining(item)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold">{item.is_active ? "Deaktivieren" : "Aktivieren"}</button><button type="button" disabled={pending} onClick={() => removeTraining(item)} className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-bold text-red-200">Löschen</button></div></div>) : <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/50">Noch keine Trainingszeiten gepflegt.</p>}</div>
      {trainingDraft ? <form onSubmit={saveTraining} className="mt-5 rounded-2xl border border-red-400/20 bg-black/20 p-4 md:p-5"><h3 className="mb-5 font-black">{editingId ? "Trainingszeit bearbeiten" : "Trainingszeit hinzufügen"}</h3><TrainingFields value={trainingDraft} onChange={setTrainingDraft}/><div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" onClick={cancelTraining} className="rounded-full border border-white/15 px-5 py-2.5 font-bold">Abbrechen</button><button type="submit" disabled={pending} className="rounded-full bg-red-600 px-5 py-2.5 font-bold disabled:opacity-50">Speichern</button></div></form> : null}
    </section>
  </div>;
}
