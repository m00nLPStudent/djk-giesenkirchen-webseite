import { InputField } from "./FormField";
import StatusSwitch from "./StatusSwitch";

export function SortOrderField({ value, onChange, label = "Reihenfolge" }) {
  return (
    <div className="max-w-xs">
      <InputField
        label={label}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function ActiveStatusField({
  checked,
  onChange,
  entityLabel = "Eintrag",
}) {
  return (
    <StatusSwitch
      checked={checked}
      onChange={onChange}
      description={`Steuert, ob dieser ${entityLabel} öffentlich angezeigt wird.`}
    />
  );
}

export function BooleanOptionField({
  checked,
  onChange,
  title,
  description,
  activeLabel = "Ja",
  inactiveLabel = "Nein",
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            {title}
          </p>
          {description && (
            <p className="mt-2 text-sm leading-6 text-white/60">
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`rounded-full px-5 py-2 text-sm font-black transition ${
            checked ? "bg-red-600 text-white" : "bg-white/10 text-white/50"
          }`}
        >
          {checked ? activeLabel : inactiveLabel}
        </button>
      </div>
    </div>
  );
}
