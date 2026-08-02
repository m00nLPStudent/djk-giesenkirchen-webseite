import { UserRound } from "lucide-react";
import Can from "@/components/admin/auth/Can";
import { AdminModuleEmptyState, AdminModulePrimaryAction } from "@/components/admin/design-system";

export default function PlayerEmptyState() {
  return <AdminModuleEmptyState icon={UserRound} title="Keine Spieler gefunden" description="Passe deine Suche oder den Filter an oder lege direkt einen neuen Spieler an." action={<Can permission="players.create" uiOnly><div className="mt-6"><AdminModulePrimaryAction href="/admin/players/new">Neuer Spieler</AdminModulePrimaryAction></div></Can>} />;
}
