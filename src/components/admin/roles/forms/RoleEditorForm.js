import { normalizeRoleKey } from "../helpers/roles.payload";

export default function RoleEditorForm({ values, errors, onChange }) {
  function handleNameChange(value) {
    onChange({
      name: value,
      key: values.keyTouched ? values.key : normalizeRoleKey(value),
    });
  }

  function handleKeyChange(value) {
    onChange({ key: normalizeRoleKey(value), keyTouched: true });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Name *
          </span>
          <input
            type="text"
            value={values.name}
            onChange={(event) => handleNameChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          />
          {errors.name && <p className="text-xs text-red-300">{errors.name}</p>}
        </label>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Key *
          </span>
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
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
          Beschreibung
        </span>
        <textarea
          value={values.description}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Sortierung
          </span>
          <input
            type="number"
            value={values.sort_order}
            onChange={(event) => onChange({ sort_order: event.target.value })}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          />
        </label>

        <label className="inline-flex items-center gap-3 pt-8 text-sm text-white/80">
          <input
            type="checkbox"
            checked={values.is_active}
            onChange={(event) => onChange({ is_active: event.target.checked })}
            className="h-4 w-4 rounded border-white/20 bg-black/30"
          />
          Aktiv
        </label>
      </div>
    </div>
  );
}
