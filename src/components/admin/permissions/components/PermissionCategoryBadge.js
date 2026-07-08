export default function PermissionCategoryBadge({ category }) {
  const rawLabel = category || "ohne-kategorie";

  const labelMap = {
    club_history: "Club History",
    membership_requests: "Mitgliedsanfragen",
  };

  const label =
    labelMap[rawLabel] ||
    rawLabel
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  return (
    <span
      className="inline-flex max-w-[14rem] items-center rounded-full border border-red-400/35 bg-red-500/15 px-3 py-1 text-[0.68rem] font-bold text-red-200"
      title={rawLabel}
    >
      <span className="max-w-full break-words text-center leading-4">
        {label}
      </span>
    </span>
  );
}
