"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

export default function MediaAssetPicker({ assets = [], mediaKind = "image", onSelect, emptyLabel = "Keine passenden Medien verfügbar." }) {
  const [search, setSearch] = useState("");
  const visible = useMemo(() => assets.filter((asset) => asset.media_kind === mediaKind && [asset.display_name, asset.original_filename, asset.alt_text].some((value) => String(value || "").toLowerCase().includes(search.trim().toLowerCase()))), [assets, mediaKind, search]);
  return <div className="space-y-4"><label className="block text-sm font-bold">Aus Medienbibliothek auswählen<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Medien suchen …" className="mt-2 block w-full rounded-2xl border border-white/10 bg-black/20 p-3" /></label>{!visible.length ? <p className="text-sm text-white/50">{emptyLabel}</p> : <div className="grid gap-3 sm:grid-cols-3">{visible.map((asset) => <button type="button" key={asset.id} onClick={() => onSelect?.(asset)} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left hover:border-red-400/50">{asset.previewUrl ? <img src={asset.previewUrl} alt={asset.alt_text || ""} className="aspect-video w-full object-cover" /> : null}<span className="block truncate p-3 text-sm font-bold">{asset.display_name}</span></button>)}</div>}</div>;
}
