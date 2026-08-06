/* eslint-disable @next/next/no-img-element */
import { FileText, Image as ImageIcon } from "lucide-react";
import { formatFileSize } from "@/lib/files";
import MediaUploadForm from "./MediaUploadForm";
import ArchiveMediaButton from "./ArchiveMediaButton";

export default function MediaLibraryModule({ assets = [], filters = {}, error = null }) {
  return <div className="space-y-6">
    <MediaUploadForm />
    <form className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:grid-cols-4">
      <input name="search" defaultValue={filters.search} placeholder="Medien suchen …" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:col-span-2" />
      <select name="kind" defaultValue={filters.kind} className="rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3"><option value="all">Alle Arten</option><option value="image">Bilder</option><option value="document">Dokumente</option></select>
      <select name="visibility" defaultValue={filters.visibility} className="rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3"><option value="all">Alle Sichtbarkeiten</option><option value="public">Öffentlich</option><option value="admin">Admin</option><option value="restricted">Eingeschränkt</option></select>
      <select name="sort" defaultValue={filters.sort} className="rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3"><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option><option value="name">Name</option><option value="largest">Größte zuerst</option></select>
      <button className="w-fit rounded-full border border-white/15 px-5 py-2 font-bold">Filtern</button>
    </form>
    {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</p> : null}
    {!error && !assets.length ? <p className="rounded-3xl border border-dashed border-white/15 p-10 text-center text-white/50">Noch keine registrierten Medien gefunden.</p> : null}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{assets.map((asset) => <article key={asset.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="flex aspect-video items-center justify-center bg-black/25">{asset.media_kind === "image" && asset.previewUrl ? <img src={asset.previewUrl} alt={asset.alt_text || asset.display_name || ""} className="h-full w-full object-cover" /> : asset.media_kind === "image" ? <ImageIcon aria-hidden="true" /> : <FileText aria-hidden="true" />}</div>
      <div className="space-y-2 p-4"><h2 className="truncate font-black" title={asset.display_name}>{asset.display_name}</h2><p className="text-xs text-white/50">{asset.media_kind} · {asset.visibility} · {formatFileSize(asset.file_size_bytes) || "–"}</p><p className="text-xs text-white/45">{asset.purpose} · {asset.media_asset_usages?.length || 0} Verwendungen</p><div className="flex flex-wrap items-center gap-3">{asset.previewUrl ? <a href={asset.previewUrl} target="_blank" rel="noreferrer" className="inline-block text-sm font-bold text-red-300">Vorschau öffnen</a> : null}<ArchiveMediaButton id={asset.id} usageCount={asset.media_asset_usages?.length || 0} /></div></div>
    </article>)}</div>
  </div>;
}
