export default function DepartmentPersonGrid({ children, emptyText = "Noch keine Personen angelegt." }) {
  if (!children) {
    return (
      <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 text-white/55">
        {emptyText}
      </div>
    );
  }

  return <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}
