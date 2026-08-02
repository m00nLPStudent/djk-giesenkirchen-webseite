import { AdminButton, AdminImagePreview } from "@/components/admin/design-system";
import { resolveMediaFileName } from "../helpers/newsMedia.core.mjs";

export default function NewsImageUpload({ imageUrl, onUpload, onRemove }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <label className="mb-2 block text-sm font-bold uppercase tracking-[0.25em] text-white/60">
        Beitragsbild
      </label>

      <label className="inline-flex cursor-pointer items-center rounded-full bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-700">
        Bild auswählen
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onUpload(e.target.files?.[0])}
          className="hidden"
        />
      </label>

      <p className="mt-3 text-sm text-white/40">
        Das Bild wird automatisch hochgeladen und als Bild-URL gespeichert.
      </p>

      {imageUrl && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/50">
              Vorschau
            </p>

            <AdminButton variant="danger" onClick={onRemove}>Bild entfernen</AdminButton>
          </div>

          <AdminImagePreview src={imageUrl} alt="Beitragsbild der News" fileName={resolveMediaFileName({ image_url: imageUrl }, "Bild")} />
        </div>
      )}
    </div>
  );
}
