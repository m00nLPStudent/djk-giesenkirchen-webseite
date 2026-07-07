export default function PermissionCategoryBadge({ category }) {
  return (
    <span className="inline-flex items-center rounded-full border border-red-400/35 bg-red-500/15 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-red-200">
      {category || "ohne-kategorie"}
    </span>
  );
}
