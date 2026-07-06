import { formatRoleStatusLabel } from "../helpers/roles.formatters";

export default function RoleStatusBadge({ isActive }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
        isActive
          ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
          : "border-orange-400/40 bg-orange-500/15 text-orange-200"
      }`}
    >
      {formatRoleStatusLabel(isActive)}
    </span>
  );
}
