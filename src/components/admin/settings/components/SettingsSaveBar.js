export default function SettingsSaveBar({
  onReset,
  onDelete,
  onSubmit,
  hasSelection,
  loading,
  newLabel,
  deleteLabel,
  saveLabel,
  loadingLabel,
}) {
  return (
    <div className="flex flex-wrap justify-end gap-3">
      <button
        type="button"
        onClick={onReset}
        className="rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
      >
        {newLabel}
      </button>
      {hasSelection && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full border border-red-500/60 px-6 py-3 text-sm font-bold text-red-300 transition hover:bg-red-600 hover:text-white"
        >
          {deleteLabel}
        </button>
      )}
      <button
        type="submit"
        onClick={onSubmit}
        disabled={loading}
        className="rounded-full bg-red-600 px-8 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? loadingLabel : saveLabel}
      </button>
    </div>
  );
}
