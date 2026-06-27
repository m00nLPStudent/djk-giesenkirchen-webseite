import { EntityStatusBadge } from "@/components/admin/ui/EntityBadge";

export default function CoachStatusBadge({ active }) {
  return <EntityStatusBadge active={active} />;
}
