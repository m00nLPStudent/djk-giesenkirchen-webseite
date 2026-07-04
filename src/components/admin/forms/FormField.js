export function ErrorText({ error }) {
  if (!error) return null;
  return <p className="mt-2 text-sm font-medium text-red-400">{error}</p>;
}

export function FieldLabel({ children, required = false }) {
  if (!children) return null;

  return (
    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/50">
      {children}
      {required && <span className="ml-1 text-red-400">*</span>}
    </label>
  );
}

export function InputField({
  error,
  label,
  required = false,
  className = "",
  onBlur,
  ...props
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        {...props}
        onBlur={onBlur}
        className={`h-14 w-full rounded-2xl border bg-white/5 px-4 outline-none ${
          error ? "border-red-500" : "border-white/10 focus:border-red-500"
        } ${className}`}
      />
      <ErrorText error={error} />
    </div>
  );
}

export function SelectField({
  error,
  label,
  required = false,
  children,
  className = "",
  ...props
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        {...props}
        className={`h-14 w-full rounded-2xl border bg-[#17171d] px-4 outline-none ${
          error ? "border-red-500" : "border-white/10 focus:border-red-500"
        } ${className}`}
      >
        {children}
      </select>
      <ErrorText error={error} />
    </div>
  );
}

export function TextareaField({
  label,
  required = false,
  className = "",
  onBlur,
  ...props
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        {...props}
        onBlur={onBlur}
        className={`w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-red-500 ${className}`}
      />
    </div>
  );
}
