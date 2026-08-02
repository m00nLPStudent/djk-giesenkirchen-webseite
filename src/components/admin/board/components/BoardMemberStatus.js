import { AdminStatusChip } from "@/components/admin/design-system";

export default function BoardMemberStatus({ member }) {
  const active = member.is_active !== false;
  return <AdminStatusChip compact variant={active ? "success" : "warning"}>{active ? "Aktiv" : "Inaktiv"}</AdminStatusChip>;
}
