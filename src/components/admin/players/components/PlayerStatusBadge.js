import { EntityStatusBadge } from "@/components/admin/ui/EntityBadge";

export default function PlayerStatusBadge({ active }) {
  return <EntityStatusBadge active={active} />;
}
