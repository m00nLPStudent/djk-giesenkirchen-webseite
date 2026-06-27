export default function PlayerImageUpload({
  imageUrl,
  placeholderUrl,
  onUpload,
  onRemove,
}) {
  const previewUrl = imageUrl || placeholderUrl;
  const isPlaceholder = previewUrl === placeholderUrl;

  return (
    <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
      <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl bg-black/20 ring-1 ring-white/10">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Spielerbild"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm text-white/40">Kein Bild</span>
        )}
      </div>

      <div>
        <p className="text-sm leading-6 text-white/50">
          Ohne eigenes Bild wird automatisch das Platzhalterbild verwendet. Beim Hochladen eines neuen Bildes wird das vorherige eigene Bild aus dem Storage entfernt.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700">
            Bild auswählen
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onUpload(file);
                }
                event.target.value = "";
              }}
              className="hidden"
            />
          </label>

          {!isPlaceholder && previewUrl && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full border border-red-500/30 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
            >
              Eigenes Bild entfernen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
