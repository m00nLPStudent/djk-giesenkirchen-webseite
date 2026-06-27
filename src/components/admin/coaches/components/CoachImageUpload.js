export default function CoachImageUpload({ imageUrl, onUpload, onRemove }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <label className="mb-2 block text-sm font-bold uppercase tracking-[0.25em] text-white/60">
        Trainerbild
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
        Das Bild wird automatisch hochgeladen.
      </p>

      {imageUrl && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/50">
              Vorschau
            </p>

            <button
              type="button"
              onClick={onRemove}
              className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10"
            >
              Bild entfernen
            </button>
          </div>

          <img
            src={imageUrl}
            alt="Trainerbild"
            className="max-h-72 w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
