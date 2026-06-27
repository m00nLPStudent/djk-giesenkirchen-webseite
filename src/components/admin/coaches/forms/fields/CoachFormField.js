export function ErrorText({ error }) {
  if (!error) return null;
  return <p className="mt-2 text-sm font-medium text-red-400">{error}</p>;
}

export function inputClass(error) {
  return `h-14 w-full rounded-2xl border bg-white/5 px-4 outline-none ${
    error ? "border-red-500" : "border-white/10 focus:border-red-500"
  }`;
}

export function selectClass(error) {
  return `h-14 w-full rounded-2xl border bg-[#18181d] px-4 text-white outline-none ${
    error ? "border-red-500" : "border-white/10 focus:border-red-500"
  }`;
}

export function TextInput({ error, ...props }) {
  return (
    <div>
      <input {...props} className={inputClass(error)} />
      <ErrorText error={error} />
    </div>
  );
}

export function SelectInput({ error, children, ...props }) {
  return (
    <div>
      <select {...props} className={selectClass(error)}>
        {children}
      </select>
      <ErrorText error={error} />
    </div>
  );
}
