export function ErrorText({ error }) {
  if (!error) return null;
  return <p className="mt-2 text-sm font-medium text-red-400">{error}</p>;
}

export function InputField({ error, className = "", ...props }) {
  return (
    <div>
      <input
        {...props}
        className={`h-14 w-full rounded-2xl border bg-white/5 px-4 outline-none ${
          error ? "border-red-500" : "border-white/10 focus:border-red-500"
        } ${className}`}
      />
      <ErrorText error={error} />
    </div>
  );
}

export function SelectField({ error, children, className = "", ...props }) {
  return (
    <div>
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

export function TextareaField({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-red-500 ${className}`}
    />
  );
}
