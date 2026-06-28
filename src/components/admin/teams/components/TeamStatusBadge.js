import { EntityStatusBadge } from "@/components/admin/ui/EntityBadge";

export default function TeamStatusBadge({ active }) {
  return <EntityStatusBadge active={active} />;
}
