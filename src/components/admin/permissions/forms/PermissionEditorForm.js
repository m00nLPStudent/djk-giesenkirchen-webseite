import { normalizePermissionKey } from "../helpers/permissions.payload";

export default function PermissionEditorForm({ values, errors, onChange }) {
  function handleNameChange(value) {
    onChange({
      name: value,
      key: values.keyTouched ? values.key : normalizePermissionKey(value),
    });
  }

  function handleKeyChange(value) {
    onChange({ key: normalizePermissionKey(value), keyTouched: true });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Name *</span>
          <input
            type="text"
            value={values.name}
            onChange={(event) => handleNameChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          />
          {errors.name && <p className="text-xs text-red-300">{errors.name}</p>}
        </label>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Key *</span>
          <input
            type="text"
            value={values.key}
            onChange={(event) => handleKeyChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          />
          {errors.key && <p className="text-xs text-red-300">{errors.key}</p>}
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Beschreibung</span>
        <textarea
          rows={3}
          value={values.description}
          onChange={(event) => onChange({ description: event.target.value })}
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
        />
      </label>

      <label className="space-y-2 block">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Kategorie *</span>
        <input
          type="text"
          value={values.category}
          onChange={(event) => onChange({ category: event.target.value.toLowerCase() })}
          placeholder="z. B. news"
          className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
        />
        {errors.category && <p className="text-xs text-red-300">{errors.category}</p>}
      </label>
    </div>
  );
}
