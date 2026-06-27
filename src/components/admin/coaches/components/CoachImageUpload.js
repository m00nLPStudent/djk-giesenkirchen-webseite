import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";

export default function CoachImageUpload({
  imageUrl,
  placeholderUrl = COACH_PLACEHOLDER_IMAGE,
  onUpload,
  onRemove,
}) {
  const previewUrl = imageUrl || placeholderUrl;
  const isPlaceholder = previewUrl === placeholderUrl;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-black">Trainerbild</h2>
      <p className="mt-2 text-sm text-white/50">
        Ohne eigenes Bild wird automatisch das Platzhalterbild verwendet.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-3xl bg-black/20">
          <img
            src={previewUrl}
            alt="Trainerbild"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="space-y-3">
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
              className="block rounded-full border border-red-500/30 px-5 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
            >
              Eigenes Bild entfernen
            </button>
          )}
        </div>
      </div>

      {previewUrl && (
        <p className="mt-4 break-all text-xs text-white/40">{previewUrl}</p>
      )}
    </div>
  );
}
