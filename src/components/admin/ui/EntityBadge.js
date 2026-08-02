import { AdminStatusChip } from "@/components/admin/design-system";

export default function EntityBadge({
  children,
  variant = "default",
  className = "",
  icon: Icon,
}) {
  return (
    <AdminStatusChip variant={variant} className={className} icon={Icon}>
      {children}
    </AdminStatusChip>
  );
}

export function EntityStatusBadge({ active, activeLabel = "Aktiv", inactiveLabel = "Inaktiv" }) {
  return (
    <EntityBadge variant={active ? "success" : "warning"}>
      {active ? activeLabel : inactiveLabel}
    </EntityBadge>
  );
}
