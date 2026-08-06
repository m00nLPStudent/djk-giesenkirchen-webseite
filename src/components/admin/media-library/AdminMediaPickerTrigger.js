"use client";

export default function AdminMediaPickerTrigger({ onClick, label = "Aus Medienbibliothek auswählen" }) {
  return <button type="button" onClick={onClick} className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:border-red-400/50">{label}</button>;
}
